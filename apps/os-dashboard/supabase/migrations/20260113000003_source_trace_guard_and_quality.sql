-- ============================================================================
-- MIGRATION: source_trace Guard + Data Quality Score RPC
-- 목적:
--   1. source_trace NOT NULL 제약 적용 (데이터 무결성)
--   2. calculate_data_quality_score RPC 함수 (데이터 품질 점수)
-- 작성일: 2026-01-13
-- ============================================================================

BEGIN;

-- ============================================================================
-- Part 1: source_trace NOT NULL 제약 (Guard)
-- ============================================================================

-- 기존 NULL 데이터를 빈 객체로 업데이트 (안전하게)
UPDATE public.daily_kpis_agg
SET source_trace = '{}'::jsonb
WHERE source_trace IS NULL;

UPDATE public.zone_daily_metrics
SET source_trace = '{}'::jsonb
WHERE source_trace IS NULL;

-- hourly_metrics (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hourly_metrics'
    AND column_name = 'source_trace'
    AND table_schema = 'public'
  ) THEN
    EXECUTE 'UPDATE public.hourly_metrics SET source_trace = ''{}''::jsonb WHERE source_trace IS NULL';
  END IF;
END $$;

-- product_performance_agg (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_performance_agg'
    AND column_name = 'source_trace'
    AND table_schema = 'public'
  ) THEN
    EXECUTE 'UPDATE public.product_performance_agg SET source_trace = ''{}''::jsonb WHERE source_trace IS NULL';
  END IF;
END $$;

-- customer_segments_agg (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_segments_agg'
    AND column_name = 'source_trace'
    AND table_schema = 'public'
  ) THEN
    EXECUTE 'UPDATE public.customer_segments_agg SET source_trace = ''{}''::jsonb WHERE source_trace IS NULL';
  ELSE
    -- source_trace 컬럼이 없으면 추가
    EXECUTE 'ALTER TABLE public.customer_segments_agg ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
  END IF;
END $$;

-- NOT NULL 제약 적용 (실패 시 무시 - 이미 적용된 경우)
DO $$
BEGIN
  -- daily_kpis_agg
  BEGIN
    ALTER TABLE public.daily_kpis_agg ALTER COLUMN source_trace SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'daily_kpis_agg source_trace already NOT NULL or error: %', SQLERRM;
  END;

  -- zone_daily_metrics
  BEGIN
    ALTER TABLE public.zone_daily_metrics ALTER COLUMN source_trace SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'zone_daily_metrics source_trace already NOT NULL or error: %', SQLERRM;
  END;
END $$;

-- DEFAULT 값 설정 (이미 설정된 경우 무시)
ALTER TABLE public.daily_kpis_agg ALTER COLUMN source_trace SET DEFAULT '{}'::jsonb;
ALTER TABLE public.zone_daily_metrics ALTER COLUMN source_trace SET DEFAULT '{}'::jsonb;

-- ============================================================================
-- Part 2: calculate_data_quality_score RPC 함수
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

  -- 데이터 소스별 가중치
  v_weights CONSTANT JSONB := '{
    "pos": 0.25,
    "sensor": 0.30,
    "crm": 0.15,
    "product": 0.15,
    "zone": 0.15
  }';
BEGIN
  -- 스토어 이름 조회
  SELECT name INTO v_store_name FROM stores WHERE id = p_store_id;

  IF v_store_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Store not found'
    );
  END IF;

  -- ========================================
  -- 1. POS/Transaction 커버리지
  -- ========================================
  SELECT COUNT(*) INTO v_count
  FROM line_items
  WHERE store_id = p_store_id
    AND transaction_date = p_date;

  -- purchases 테이블도 확인
  IF v_count = 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM purchases
    WHERE store_id = p_store_id
      AND DATE(created_at) = p_date;
  END IF;

  v_coverage := v_coverage || jsonb_build_object(
    'pos', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', LEAST(v_count::NUMERIC / 100, 1),
      'label', 'POS/매출 데이터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing',
      'source', 'pos',
      'severity', 'high',
      'message', 'POS 데이터가 없습니다. 매출 분석이 제한됩니다.',
      'affected_metrics', ARRAY['total_revenue', 'avg_transaction_value', 'conversion_rate']
    );
  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 100, 1) * (v_weights->>'pos')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'pos')::NUMERIC;

  -- ========================================
  -- 2. Sensor (zone_events) 커버리지
  -- ========================================
  SELECT COUNT(*) INTO v_count
  FROM zone_events
  WHERE store_id = p_store_id
    AND event_date = p_date;

  -- funnel_events도 확인
  IF v_count = 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM funnel_events
    WHERE store_id = p_store_id
      AND event_date = p_date;
  END IF;

  v_coverage := v_coverage || jsonb_build_object(
    'sensor', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', LEAST(v_count::NUMERIC / 500, 1),
      'label', 'NEURALSENSE 센서 데이터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing',
      'source', 'sensor',
      'severity', 'high',
      'message', 'NEURALSENSE 데이터가 없습니다. 동선/히트맵 분석이 불가합니다.',
      'affected_metrics', ARRAY['visitor_count', 'dwell_time', 'zone_traffic', 'heatmap']
    );
  ELSIF v_count < 100 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'stale',
      'source', 'sensor',
      'severity', 'medium',
      'message', '센서 데이터가 부족합니다. 분석 정확도가 낮을 수 있습니다.',
      'affected_metrics', ARRAY['visitor_count', 'dwell_time']
    );
  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 500, 1) * (v_weights->>'sensor')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'sensor')::NUMERIC;

  -- ========================================
  -- 3. CRM/Customer 커버리지
  -- ========================================
  SELECT COUNT(*) INTO v_count
  FROM customers
  WHERE store_id = p_store_id;

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
      'type', 'missing',
      'source', 'crm',
      'severity', 'low',
      'message', '고객 데이터가 없습니다. 고객 세그먼트 분석이 제한됩니다.',
      'affected_metrics', ARRAY['customer_segments', 'ltv', 'retention']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'crm')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'crm')::NUMERIC;

  -- ========================================
  -- 4. Product 커버리지
  -- ========================================
  SELECT COUNT(*) INTO v_count
  FROM products
  WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object(
    'product', jsonb_build_object(
      'available', v_count > 0,
      'record_count', v_count,
      'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END,
      'label', '상품 마스터 데이터'
    )
  );

  IF v_count = 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing',
      'source', 'product',
      'severity', 'medium',
      'message', '상품 데이터가 없습니다. 상품 성과 분석이 제한됩니다.',
      'affected_metrics', ARRAY['product_performance', 'category_analysis']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'product')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'product')::NUMERIC;

  -- ========================================
  -- 5. Zone 커버리지
  -- ========================================
  SELECT COUNT(*) INTO v_count
  FROM zones_dim
  WHERE store_id = p_store_id
    AND is_active = true;

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
      'type', 'missing',
      'source', 'zone',
      'severity', 'high',
      'message', '존 설정이 없습니다. 공간 분석이 불가합니다.',
      'affected_metrics', ARRAY['zone_metrics', 'heatmap', 'flow_analysis']
    );
  END IF;

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * (v_weights->>'zone')::NUMERIC;
  v_weight_sum := v_weight_sum + (v_weights->>'zone')::NUMERIC;

  -- ========================================
  -- 6. Raw Imports 현황 (추가 정보)
  -- ========================================
  DECLARE
    v_raw_imports_stats JSONB;
  BEGIN
    SELECT jsonb_build_object(
      'total_count', COUNT(*),
      'completed_count', COUNT(*) FILTER (WHERE status = 'completed'),
      'failed_count', COUNT(*) FILTER (WHERE status = 'failed'),
      'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
      'latest_import', MAX(created_at)
    )
    INTO v_raw_imports_stats
    FROM raw_imports
    WHERE store_id = p_store_id;

    v_coverage := v_coverage || jsonb_build_object(
      'raw_imports', v_raw_imports_stats
    );
  END;

  -- ========================================
  -- 7. 최종 결과 구성
  -- ========================================
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
    'warnings', v_issues,
    'warning_count', jsonb_array_length(v_issues),
    'weights', v_weights,
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.calculate_data_quality_score IS
'데이터 품질/커버리지 점수 계산
- POS, Sensor, CRM, Product, Zone 데이터 커버리지 분석
- 가중치 기반 종합 점수 산출
- 데이터 경고 및 영향받는 메트릭 표시';

-- RPC 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.calculate_data_quality_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_data_quality_score TO service_role;

-- ============================================================================
-- Part 3: get_data_control_tower_status RPC (Control Tower 대시보드용)
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
  v_etl_runs JSONB;
  v_pipeline_stats JSONB;
  v_quality_score JSONB;
BEGIN
  -- 1. 데이터 품질 점수
  v_quality_score := calculate_data_quality_score(p_store_id, CURRENT_DATE);

  -- 2. 최근 Imports
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'source_type', source_type,
      'source_name', source_name,
      'data_type', data_type,
      'row_count', row_count,
      'status', status,
      'error_message', error_message,
      'created_at', created_at,
      'completed_at', completed_at
    ) ORDER BY created_at DESC
  )
  INTO v_recent_imports
  FROM (
    SELECT * FROM raw_imports
    WHERE store_id = p_store_id
    ORDER BY created_at DESC
    LIMIT p_limit
  ) sub;

  -- 3. 최근 ETL Runs
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'etl_function', etl_function,
      'status', status,
      'input_record_count', input_record_count,
      'output_record_count', output_record_count,
      'duration_ms', duration_ms,
      'started_at', started_at,
      'completed_at', completed_at
    ) ORDER BY started_at DESC
  )
  INTO v_etl_runs
  FROM (
    SELECT * FROM etl_runs
    WHERE store_id = p_store_id
    ORDER BY started_at DESC
    LIMIT p_limit
  ) sub;

  -- 4. 파이프라인 통계
  SELECT jsonb_build_object(
    'raw_imports', jsonb_build_object(
      'total', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'failed', COUNT(*) FILTER (WHERE status = 'failed'),
      'pending', COUNT(*) FILTER (WHERE status = 'pending')
    )
  )
  INTO v_pipeline_stats
  FROM raw_imports
  WHERE store_id = p_store_id;

  -- ETL 통계 추가
  SELECT v_pipeline_stats || jsonb_build_object(
    'etl_runs', jsonb_build_object(
      'total', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'failed', COUNT(*) FILTER (WHERE status = 'failed'),
      'running', COUNT(*) FILTER (WHERE status = 'running')
    )
  )
  INTO v_pipeline_stats
  FROM etl_runs
  WHERE store_id = p_store_id;

  -- L2/L3 레코드 수
  DECLARE
    v_l2_count INTEGER := 0;
    v_l3_count INTEGER := 0;
  BEGIN
    SELECT COUNT(*) INTO v_l2_count FROM zone_events WHERE store_id = p_store_id;
    SELECT COUNT(*) INTO v_l3_count FROM daily_kpis_agg WHERE store_id = p_store_id;

    v_pipeline_stats := v_pipeline_stats || jsonb_build_object(
      'l2_records', v_l2_count,
      'l3_records', v_l3_count
    );
  END;

  -- 5. 데이터 소스 상태
  v_data_sources := jsonb_build_object(
    'pos', jsonb_build_object(
      'name', 'POS',
      'description', '매출/거래 데이터',
      'status', CASE
        WHEN (v_quality_score->'coverage'->'pos'->>'available')::boolean THEN 'active'
        ELSE 'inactive'
      END,
      'last_sync', (
        SELECT MAX(created_at) FROM raw_imports
        WHERE store_id = p_store_id AND data_type IN ('purchases', 'sales', 'transactions')
      )
    ),
    'sensor', jsonb_build_object(
      'name', 'NEURALSENSE',
      'description', 'WiFi/BLE 센서',
      'status', CASE
        WHEN (v_quality_score->'coverage'->'sensor'->>'available')::boolean THEN 'active'
        ELSE 'inactive'
      END,
      'last_sync', (
        SELECT MAX(created_at) FROM raw_imports
        WHERE store_id = p_store_id AND source_type = 'neuralsense'
      )
    ),
    'crm', jsonb_build_object(
      'name', 'CRM',
      'description', '고객/CDP 데이터',
      'status', CASE
        WHEN (v_quality_score->'coverage'->'crm'->>'available')::boolean THEN 'active'
        ELSE 'inactive'
      END,
      'last_sync', (
        SELECT MAX(created_at) FROM raw_imports
        WHERE store_id = p_store_id AND data_type = 'customers'
      )
    ),
    'product', jsonb_build_object(
      'name', 'ERP',
      'description', '재고/상품 데이터',
      'status', CASE
        WHEN (v_quality_score->'coverage'->'product'->>'available')::boolean THEN 'active'
        ELSE 'inactive'
      END,
      'last_sync', (
        SELECT MAX(created_at) FROM raw_imports
        WHERE store_id = p_store_id AND data_type = 'products'
      )
    )
  );

  -- 최종 결과
  v_result := jsonb_build_object(
    'success', true,
    'store_id', p_store_id,
    'quality_score', v_quality_score,
    'data_sources', v_data_sources,
    'recent_imports', COALESCE(v_recent_imports, '[]'::jsonb),
    'recent_etl_runs', COALESCE(v_etl_runs, '[]'::jsonb),
    'pipeline_stats', v_pipeline_stats,
    'queried_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_data_control_tower_status IS
'데이터 컨트롤타워 대시보드 데이터 조회
- 데이터 품질 점수
- 데이터 소스 상태
- 최근 Import 내역
- ETL 실행 현황
- 파이프라인 통계';

GRANT EXECUTE ON FUNCTION public.get_data_control_tower_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_control_tower_status TO service_role;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================

-- 1. source_trace NOT NULL 확인
SELECT
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE column_name = 'source_trace'
  AND table_schema = 'public'
ORDER BY table_name;

-- 2. 새 함수 확인
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_data_quality_score', 'get_data_control_tower_status');
