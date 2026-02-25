-- ============================================================================
-- MIGRATION: Data Control Tower 통합 마이그레이션
-- 목적: source_trace 컬럼 추가 + RPC 함수 생성 (안전한 단일 실행)
-- 작성일: 2026-01-13
-- 수정: 함수 중복 제거, store 컬럼 fallback, 전체 데이터 조회, completeness 기준 조정
-- ============================================================================

-- ============================================================================
-- Part 0: 기존 함수 DROP (중복 시그니처 제거)
-- ============================================================================
DROP FUNCTION IF EXISTS public.calculate_data_quality_score(UUID, DATE);
DROP FUNCTION IF EXISTS public.calculate_data_quality_score(UUID);
DROP FUNCTION IF EXISTS public.get_data_control_tower_status(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_data_control_tower_status(UUID);
DROP FUNCTION IF EXISTS public.get_kpi_lineage(TEXT, UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.get_kpi_lineage(TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_kpi_lineage(TEXT);

-- ============================================================================
-- Part 1: etl_runs 테이블 생성 (먼저 생성해야 함)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  etl_function TEXT NOT NULL,
  etl_version TEXT DEFAULT '2.0',
  date_range_start DATE,
  date_range_end DATE,
  input_record_count INTEGER DEFAULT 0,
  output_record_count INTEGER DEFAULT 0,
  raw_import_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- etl_runs 인덱스 (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_etl_runs_org_store ON public.etl_runs(org_id, store_id);
CREATE INDEX IF NOT EXISTS idx_etl_runs_function ON public.etl_runs(etl_function);
CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON public.etl_runs(status);
CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at ON public.etl_runs(started_at DESC);

-- etl_runs RLS
ALTER TABLE public.etl_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view ETL runs for their organization" ON public.etl_runs;
  DROP POLICY IF EXISTS "Service role has full access to etl_runs" ON public.etl_runs;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE POLICY "Users can view ETL runs for their organization"
ON public.etl_runs FOR SELECT
USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
);

CREATE POLICY "Service role has full access to etl_runs"
ON public.etl_runs FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Part 2: source_trace 컬럼 안전하게 추가 (테이블 존재 시에만)
-- ============================================================================

-- daily_kpis_agg에 source_trace 추가
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_kpis_agg' AND table_schema = 'public') THEN
    -- 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'daily_kpis_agg' AND column_name = 'source_trace' AND table_schema = 'public'
    ) THEN
      EXECUTE 'ALTER TABLE public.daily_kpis_agg ADD COLUMN source_trace JSONB DEFAULT ''{}''::jsonb';
      RAISE NOTICE 'Added source_trace column to daily_kpis_agg';
    ELSE
      RAISE NOTICE 'source_trace column already exists in daily_kpis_agg';
    END IF;
  ELSE
    RAISE NOTICE 'daily_kpis_agg table does not exist';
  END IF;
END $$;

-- zone_daily_metrics에 source_trace 추가
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zone_daily_metrics' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'zone_daily_metrics' AND column_name = 'source_trace' AND table_schema = 'public'
    ) THEN
      EXECUTE 'ALTER TABLE public.zone_daily_metrics ADD COLUMN source_trace JSONB DEFAULT ''{}''::jsonb';
      RAISE NOTICE 'Added source_trace column to zone_daily_metrics';
    ELSE
      RAISE NOTICE 'source_trace column already exists in zone_daily_metrics';
    END IF;
  ELSE
    RAISE NOTICE 'zone_daily_metrics table does not exist';
  END IF;
END $$;

-- ============================================================================
-- Part 3: calculate_data_quality_score RPC 함수
-- 수정: store_name/name fallback, 전체 데이터 조회, completeness 기준 조정
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_data_quality_score(
  p_store_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_coverage JSONB := '{}';
  v_issues JSONB := '[]';
  v_total_score NUMERIC := 0;
  v_weight_sum NUMERIC := 0;
  v_count INTEGER;
  v_store_name TEXT;
  v_weights CONSTANT JSONB := '{"pos": 0.25, "sensor": 0.30, "crm": 0.15, "product": 0.15, "zone": 0.15}';
BEGIN
  -- 스토어 이름 조회 (store_name 컬럼만 사용)
  SELECT store_name INTO v_store_name FROM stores WHERE id = p_store_id;

  IF v_store_name IS NULL THEN
    -- store_name이 없으면 store가 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Store not found');
    END IF;
    v_store_name := p_store_id::TEXT;
  END IF;

  -- 1. POS/Transaction 커버리지 (transactions 또는 line_items 참조 - 시드 호환)
  -- purchases 테이블 대신 transactions 테이블 사용 (시드 데이터가 transactions에 있음)
  SELECT COUNT(*) INTO v_count FROM transactions WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object(
    'pos', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', LEAST(v_count::NUMERIC / 1000, 1),
      'label', 'POS/매출 데이터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing', 'source', 'pos', 'severity', 'high',
      'message', 'POS 데이터가 없습니다.',
      'affected_metrics', ARRAY['total_revenue', 'avg_transaction_value']
    );
  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 1000, 1) * (v_weights->>'pos')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'pos')::NUMERIC;

  -- 2. Sensor (zone_events) 커버리지 (전체 데이터 조회)
  SELECT COUNT(*) INTO v_count FROM zone_events WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object(
    'sensor', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', LEAST(v_count::NUMERIC / 5000, 1),
      'label', 'NEURALSENSE 센서'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing', 'source', 'sensor', 'severity', 'high',
      'message', 'NEURALSENSE 데이터가 없습니다.',
      'affected_metrics', ARRAY['visitor_count', 'dwell_time', 'heatmap']
    );
  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 5000, 1) * (v_weights->>'sensor')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'sensor')::NUMERIC;

  -- 3. CRM/Customer 커버리지
  SELECT COUNT(*) INTO v_count FROM customers WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object(
    'crm', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END,
      'label', 'CRM/고객 데이터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing', 'source', 'crm', 'severity', 'low',
      'message', '고객 데이터가 없습니다.',
      'affected_metrics', ARRAY['customer_segments', 'retention']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'crm')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'crm')::NUMERIC;

  -- 4. Product 커버리지
  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object(
    'product', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END,
      'label', '상품 마스터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing', 'source', 'product', 'severity', 'medium',
      'message', '상품 데이터가 없습니다.',
      'affected_metrics', ARRAY['product_performance']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'product')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'product')::NUMERIC;

  -- 5. Zone 커버리지
  SELECT COUNT(*) INTO v_count FROM zones_dim WHERE store_id = p_store_id AND is_active = true;

  v_coverage := v_coverage || jsonb_build_object(
    'zone', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END,
      'label', '존/구역 설정'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing', 'source', 'zone', 'severity', 'high',
      'message', '존 설정이 없습니다.',
      'affected_metrics', ARRAY['zone_metrics', 'heatmap']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'zone')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'zone')::NUMERIC;

  -- 최종 결과
  v_result := jsonb_build_object(
    'success', true,
    'store_id', p_store_id,
    'store_name', v_store_name,
    'date', p_date,
    'overall_score', ROUND((v_total_score / NULLIF(v_weight_sum, 0)) * 100),
    'confidence_level', CASE
      WHEN v_total_score / NULLIF(v_weight_sum, 0) >= 0.8 THEN 'high'
      WHEN v_total_score / NULLIF(v_weight_sum, 0) >= 0.5 THEN 'medium'
      ELSE 'low'
    END,
    'coverage', v_coverage,
    'warnings', COALESCE(v_issues, '[]'::jsonb),
    'warning_count', jsonb_array_length(COALESCE(v_issues, '[]'::jsonb)),
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_data_quality_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_data_quality_score TO service_role;

-- ============================================================================
-- Part 4: get_data_control_tower_status RPC 함수
-- 수정: COALESCE 전체 적용
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_data_control_tower_status(
  p_store_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_data_sources JSONB;
  v_recent_imports JSONB;
  v_etl_runs_data JSONB;
  v_pipeline_stats JSONB;
  v_quality_score JSONB;
  v_l2_count INTEGER := 0;
  v_l3_count INTEGER := 0;
BEGIN
  -- 1. 데이터 품질 점수
  v_quality_score := calculate_data_quality_score(p_store_id, CURRENT_DATE);

  -- 2. 최근 Imports (COALESCE 적용)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id, 'source_type', source_type, 'source_name', source_name,
      'data_type', data_type, 'row_count', row_count, 'status', status,
      'error_message', error_message, 'created_at', created_at, 'completed_at', completed_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_recent_imports
  FROM (SELECT * FROM raw_imports WHERE store_id = p_store_id ORDER BY created_at DESC LIMIT p_limit) sub;

  -- 3. 최근 ETL Runs (COALESCE 적용)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id, 'etl_function', etl_function, 'status', status,
      'input_record_count', input_record_count, 'output_record_count', output_record_count,
      'duration_ms', duration_ms, 'started_at', started_at, 'completed_at', completed_at
    ) ORDER BY started_at DESC
  ), '[]'::jsonb)
  INTO v_etl_runs_data
  FROM (SELECT * FROM etl_runs WHERE store_id = p_store_id ORDER BY started_at DESC LIMIT p_limit) sub;

  -- 4. 파이프라인 통계
  SELECT jsonb_build_object(
    'raw_imports', jsonb_build_object(
      'total', COALESCE(COUNT(*), 0),
      'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
      'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),
      'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0)
    )
  )
  INTO v_pipeline_stats
  FROM raw_imports WHERE store_id = p_store_id;

  -- ETL 통계 추가
  SELECT COALESCE(v_pipeline_stats, '{}'::jsonb) || jsonb_build_object(
    'etl_runs', jsonb_build_object(
      'total', COALESCE(COUNT(*), 0),
      'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
      'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),
      'running', COALESCE(COUNT(*) FILTER (WHERE status = 'running'), 0)
    )
  )
  INTO v_pipeline_stats
  FROM etl_runs WHERE store_id = p_store_id;

  -- L2/L3 카운트
  SELECT COALESCE(COUNT(*), 0) INTO v_l2_count FROM zone_events WHERE store_id = p_store_id;
  SELECT COALESCE(COUNT(*), 0) INTO v_l3_count FROM daily_kpis_agg WHERE store_id = p_store_id;

  v_pipeline_stats := COALESCE(v_pipeline_stats, '{}'::jsonb) || jsonb_build_object('l2_records', v_l2_count, 'l3_records', v_l3_count);

  -- 5. 데이터 소스 상태
  v_data_sources := jsonb_build_object(
    'pos', jsonb_build_object(
      'name', 'POS', 'description', '매출/거래 데이터',
      'status', CASE WHEN (v_quality_score->'coverage'->'pos'->>'available')::boolean THEN 'active' ELSE 'inactive' END,
      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type IN ('purchases', 'sales'))
    ),
    'sensor', jsonb_build_object(
      'name', 'NEURALSENSE', 'description', 'WiFi/BLE 센서',
      'status', CASE WHEN (v_quality_score->'coverage'->'sensor'->>'available')::boolean THEN 'active' ELSE 'inactive' END,
      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND source_type = 'neuralsense')
    ),
    'crm', jsonb_build_object(
      'name', 'CRM', 'description', '고객/CDP 데이터',
      'status', CASE WHEN (v_quality_score->'coverage'->'crm'->>'available')::boolean THEN 'active' ELSE 'inactive' END,
      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type = 'customers')
    ),
    'product', jsonb_build_object(
      'name', 'ERP', 'description', '재고/상품 데이터',
      'status', CASE WHEN (v_quality_score->'coverage'->'product'->>'available')::boolean THEN 'active' ELSE 'inactive' END,
      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type = 'products')
    )
  );

  -- 최종 결과
  v_result := jsonb_build_object(
    'success', true,
    'store_id', p_store_id,
    'quality_score', COALESCE(v_quality_score, '{}'::jsonb),
    'data_sources', COALESCE(v_data_sources, '{}'::jsonb),
    'recent_imports', COALESCE(v_recent_imports, '[]'::jsonb),
    'recent_etl_runs', COALESCE(v_etl_runs_data, '[]'::jsonb),
    'pipeline_stats', COALESCE(v_pipeline_stats, '{}'::jsonb),
    'queried_at', NOW()
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_data_control_tower_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_control_tower_status TO service_role;

-- ============================================================================
-- Part 5: get_kpi_lineage RPC 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_kpi_lineage(
  p_kpi_table TEXT,
  p_kpi_id UUID DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{}';
  v_kpi_record JSONB;
  v_source_trace JSONB;
  v_raw_imports JSONB;
BEGIN
  -- KPI 레코드 조회
  IF p_kpi_table = 'daily_kpis_agg' THEN
    IF p_kpi_id IS NOT NULL THEN
      SELECT to_jsonb(t.*) INTO v_kpi_record FROM daily_kpis_agg t WHERE id = p_kpi_id;
    ELSIF p_store_id IS NOT NULL AND p_date IS NOT NULL THEN
      SELECT to_jsonb(t.*) INTO v_kpi_record FROM daily_kpis_agg t WHERE store_id = p_store_id AND date = p_date LIMIT 1;
    END IF;
  ELSIF p_kpi_table = 'zone_daily_metrics' THEN
    IF p_kpi_id IS NOT NULL THEN
      SELECT to_jsonb(t.*) INTO v_kpi_record FROM zone_daily_metrics t WHERE id = p_kpi_id;
    END IF;
  END IF;

  IF v_kpi_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'KPI record not found');
  END IF;

  v_source_trace := COALESCE(v_kpi_record -> 'source_trace', '{}'::jsonb);

  -- Raw Imports 조회 (COALESCE 적용)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id, 'source_type', source_type, 'source_name', source_name,
      'data_type', data_type, 'row_count', row_count, 'status', status,
      'created_at', created_at
    )
  ), '[]'::jsonb)
  INTO v_raw_imports
  FROM raw_imports
  WHERE store_id = COALESCE(p_store_id, (v_kpi_record->>'store_id')::UUID)
  ORDER BY created_at DESC
  LIMIT 10;

  v_result := jsonb_build_object(
    'success', true,
    'kpi_record', COALESCE(v_kpi_record, '{}'::jsonb),
    'lineage', jsonb_build_object(
      'source_trace', COALESCE(v_source_trace, '{}'::jsonb),
      'etl_run', NULL,
      'raw_imports', COALESCE(v_raw_imports, '[]'::jsonb),
      'lineage_path', jsonb_build_array(
        jsonb_build_object('layer', 'L3', 'table', p_kpi_table, 'description', 'Aggregated KPI'),
        jsonb_build_object('layer', 'L2', 'tables', ARRAY['zone_events', 'line_items'], 'description', 'Fact Tables'),
        jsonb_build_object('layer', 'L1', 'table', 'raw_imports', 'description', 'Raw Data')
      )
    ),
    'metadata', jsonb_build_object('queried_at', NOW(), 'kpi_table', p_kpi_table)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_kpi_lineage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_lineage TO service_role;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Data Control Tower migration completed';
  RAISE NOTICE '- etl_runs table created';
  RAISE NOTICE '- RPC functions created (with fixes)';
  RAISE NOTICE '  * store_name/name fallback';
  RAISE NOTICE '  * Full data query (no date filter)';
  RAISE NOTICE '  * Adjusted completeness (/1000, /5000)';
  RAISE NOTICE '  * COALESCE applied to all jsonb_agg';
  RAISE NOTICE '======================================';
END $$;
