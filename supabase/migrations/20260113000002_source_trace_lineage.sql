-- ============================================================================
-- MIGRATION: source_trace 컬럼 추가 (Data Lineage)
-- 목적: CTO 요구사항 "KPI 계산의 추적성 확보" 충족
-- 작성일: 2026-01-13
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: L3 Aggregation 테이블에 source_trace 컬럼 추가
-- ============================================================================

-- source_trace 구조:
-- {
--   "raw_import_ids": ["uuid1", "uuid2"],     -- L1 raw_imports 참조
--   "source_tables": ["visits_fact", "zones_dim"],  -- L2 소스 테이블
--   "date_range": {"start": "2026-01-01", "end": "2026-01-07"},
--   "source_record_counts": {"visits_fact": 1500, "zones_dim": 20},
--   "etl_run_id": "uuid",                     -- ETL 실행 ID
--   "etl_function": "aggregate-daily-kpis",   -- 처리 함수명
--   "calculated_at": "2026-01-13T10:00:00Z"   -- 계산 시점
-- }

-- 1.1 daily_kpis_agg 테이블
ALTER TABLE public.daily_kpis_agg
ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.daily_kpis_agg.source_trace IS
'Data Lineage 정보 - L1 raw_imports부터 이 집계까지의 추적 경로';

-- 1.2 zone_daily_metrics 테이블
ALTER TABLE public.zone_daily_metrics
ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.zone_daily_metrics.source_trace IS
'Data Lineage 정보 - Zone 메트릭 계산의 원본 데이터 추적';

-- 1.3 product_performance_agg 테이블 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_performance_agg' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.product_performance_agg ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'COMMENT ON COLUMN public.product_performance_agg.source_trace IS ''Data Lineage 정보 - 상품 성과 집계의 원본 데이터 추적''';
    RAISE NOTICE 'Added source_trace to product_performance_agg';
  ELSE
    RAISE NOTICE 'product_performance_agg table does not exist, skipping';
  END IF;
END $$;

-- 1.4 hourly_metrics 테이블 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hourly_metrics' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.hourly_metrics ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'COMMENT ON COLUMN public.hourly_metrics.source_trace IS ''Data Lineage 정보 - 시간대별 메트릭 계산의 원본 데이터 추적''';
    RAISE NOTICE 'Added source_trace to hourly_metrics';
  ELSE
    RAISE NOTICE 'hourly_metrics table does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- Step 2: L2 Fact 테이블에도 source_trace 추가 (L1→L2 추적용)
-- ============================================================================

-- 2.1 visits_fact 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits_fact' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.visits_fact ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'COMMENT ON COLUMN public.visits_fact.source_trace IS ''Data Lineage 정보 - raw_imports로부터의 변환 추적''';
    RAISE NOTICE 'Added source_trace to visits_fact';
  ELSE
    RAISE NOTICE 'visits_fact table does not exist, skipping';
  END IF;
END $$;

-- 2.2 purchases_fact 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases_fact' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.purchases_fact ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'COMMENT ON COLUMN public.purchases_fact.source_trace IS ''Data Lineage 정보 - raw_imports로부터의 변환 추적''';
    RAISE NOTICE 'Added source_trace to purchases_fact';
  ELSE
    RAISE NOTICE 'purchases_fact table does not exist, skipping';
  END IF;
END $$;

-- 2.3 zone_transitions 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zone_transitions' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.zone_transitions ADD COLUMN IF NOT EXISTS source_trace JSONB DEFAULT ''{}''::jsonb';
    EXECUTE 'COMMENT ON COLUMN public.zone_transitions.source_trace IS ''Data Lineage 정보 - Zone 전환 데이터의 원본 추적''';
    RAISE NOTICE 'Added source_trace to zone_transitions';
  ELSE
    RAISE NOTICE 'zone_transitions table does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- Step 3: source_trace 검색을 위한 GIN 인덱스 생성
-- ============================================================================

-- daily_kpis_agg source_trace 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_kpis_agg_source_trace
ON public.daily_kpis_agg USING GIN (source_trace);

-- zone_daily_metrics source_trace 인덱스
CREATE INDEX IF NOT EXISTS idx_zone_daily_metrics_source_trace
ON public.zone_daily_metrics USING GIN (source_trace);

-- ============================================================================
-- Step 4: etl_runs 테이블 생성 (ETL 실행 이력 추적)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),

  -- ETL 실행 정보
  etl_function TEXT NOT NULL,           -- 실행된 함수명
  etl_version TEXT DEFAULT '2.0',       -- ETL 버전

  -- 처리 범위
  date_range_start DATE,                -- 처리 시작일
  date_range_end DATE,                  -- 처리 종료일

  -- 입력/출력 통계
  input_record_count INTEGER DEFAULT 0, -- 입력 레코드 수
  output_record_count INTEGER DEFAULT 0,-- 출력 레코드 수

  -- 연결된 raw_imports
  raw_import_ids UUID[] DEFAULT '{}',   -- 관련 raw_imports ID 배열

  -- 처리 결과
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_message TEXT,
  error_details JSONB,

  -- 성능 메트릭
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,                  -- 처리 소요 시간 (ms)

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- etl_runs 인덱스
CREATE INDEX IF NOT EXISTS idx_etl_runs_org_store
ON public.etl_runs(org_id, store_id);

CREATE INDEX IF NOT EXISTS idx_etl_runs_function
ON public.etl_runs(etl_function);

CREATE INDEX IF NOT EXISTS idx_etl_runs_status
ON public.etl_runs(status);

CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at
ON public.etl_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_etl_runs_raw_import_ids
ON public.etl_runs USING GIN (raw_import_ids);

COMMENT ON TABLE public.etl_runs IS
'ETL 실행 이력 테이블 - 모든 ETL 처리의 실행 기록 및 성능 메트릭 추적';

-- ============================================================================
-- Step 5: RLS 정책 설정
-- ============================================================================

ALTER TABLE public.etl_runs ENABLE ROW LEVEL SECURITY;

-- 조직 기반 조회 정책
CREATE POLICY "Users can view ETL runs for their organization"
ON public.etl_runs
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 서비스 역할 전체 접근
CREATE POLICY "Service role has full access to etl_runs"
ON public.etl_runs
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Step 6: get_kpi_lineage RPC 함수 생성
-- ============================================================================

-- KPI 데이터의 전체 Lineage 추적 함수
CREATE OR REPLACE FUNCTION public.get_kpi_lineage(
  p_kpi_table TEXT,        -- 'daily_kpis_agg', 'zone_daily_metrics' 등
  p_kpi_id UUID DEFAULT NULL,  -- 특정 레코드 ID (선택)
  p_store_id UUID DEFAULT NULL,
  p_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{}';
  v_source_trace JSONB;
  v_etl_run_id UUID;
  v_raw_import_ids UUID[];
  v_etl_run JSONB;
  v_raw_imports JSONB;
  v_kpi_record JSONB;
BEGIN
  -- 1. KPI 레코드 조회
  IF p_kpi_table = 'daily_kpis_agg' THEN
    IF p_kpi_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'id', id,
        'date', date,
        'store_id', store_id,
        'total_revenue', total_revenue,
        'total_transactions', total_transactions,
        'total_visitors', total_visitors,
        'source_trace', source_trace
      )
      INTO v_kpi_record
      FROM daily_kpis_agg
      WHERE id = p_kpi_id;
    ELSIF p_store_id IS NOT NULL AND p_date IS NOT NULL THEN
      SELECT jsonb_build_object(
        'id', id,
        'date', date,
        'store_id', store_id,
        'total_revenue', total_revenue,
        'total_transactions', total_transactions,
        'total_visitors', total_visitors,
        'source_trace', source_trace
      )
      INTO v_kpi_record
      FROM daily_kpis_agg
      WHERE store_id = p_store_id AND date = p_date
      LIMIT 1;
    END IF;

  ELSIF p_kpi_table = 'zone_daily_metrics' THEN
    IF p_kpi_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'id', id,
        'date', date,
        'store_id', store_id,
        'zone_id', zone_id,
        'zone_name', zone_name,
        'visit_count', visit_count,
        'avg_dwell_time', avg_dwell_time,
        'source_trace', source_trace
      )
      INTO v_kpi_record
      FROM zone_daily_metrics
      WHERE id = p_kpi_id;
    END IF;
  END IF;

  IF v_kpi_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'KPI record not found'
    );
  END IF;

  v_source_trace := v_kpi_record -> 'source_trace';

  -- 2. ETL Run 정보 조회
  IF v_source_trace IS NOT NULL AND v_source_trace ->> 'etl_run_id' IS NOT NULL THEN
    v_etl_run_id := (v_source_trace ->> 'etl_run_id')::UUID;

    SELECT jsonb_build_object(
      'id', id,
      'etl_function', etl_function,
      'etl_version', etl_version,
      'date_range_start', date_range_start,
      'date_range_end', date_range_end,
      'input_record_count', input_record_count,
      'output_record_count', output_record_count,
      'status', status,
      'started_at', started_at,
      'completed_at', completed_at,
      'duration_ms', duration_ms,
      'raw_import_ids', raw_import_ids
    )
    INTO v_etl_run
    FROM etl_runs
    WHERE id = v_etl_run_id;

    -- ETL run의 raw_import_ids 추출
    IF v_etl_run IS NOT NULL THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(v_etl_run -> 'raw_import_ids'))::UUID[]
      INTO v_raw_import_ids;
    END IF;
  END IF;

  -- source_trace의 raw_import_ids도 확인
  IF v_source_trace IS NOT NULL AND v_source_trace -> 'raw_import_ids' IS NOT NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        COALESCE(v_raw_import_ids, '{}') ||
        ARRAY(SELECT jsonb_array_elements_text(v_source_trace -> 'raw_import_ids'))::UUID[]
      )
    )
    INTO v_raw_import_ids;
  END IF;

  -- 3. Raw Imports 정보 조회
  IF v_raw_import_ids IS NOT NULL AND array_length(v_raw_import_ids, 1) > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'source_type', source_type,
        'source_name', source_name,
        'data_type', data_type,
        'row_count', row_count,
        'status', status,
        'created_at', created_at,
        'completed_at', completed_at
      )
    )
    INTO v_raw_imports
    FROM raw_imports
    WHERE id = ANY(v_raw_import_ids);
  END IF;

  -- 4. 결과 조합
  v_result := jsonb_build_object(
    'success', true,
    'kpi_record', v_kpi_record,
    'lineage', jsonb_build_object(
      'source_trace', v_source_trace,
      'etl_run', v_etl_run,
      'raw_imports', COALESCE(v_raw_imports, '[]'::jsonb),
      'lineage_path', jsonb_build_array(
        jsonb_build_object('layer', 'L3', 'table', p_kpi_table, 'description', 'Aggregated KPI'),
        jsonb_build_object('layer', 'L2', 'tables', v_source_trace -> 'source_tables', 'description', 'Fact/Dimension Tables'),
        jsonb_build_object('layer', 'L1', 'table', 'raw_imports', 'description', 'Original Raw Data')
      )
    ),
    'metadata', jsonb_build_object(
      'queried_at', NOW(),
      'kpi_table', p_kpi_table
    )
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_kpi_lineage IS
'KPI 데이터의 전체 Lineage 추적
- L3 집계 테이블 → L2 팩트/디멘션 테이블 → L1 원본 데이터까지 추적
- CTO 요구사항: "KPI 계산의 추적성 확보"';

-- RPC 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_kpi_lineage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_lineage TO service_role;

-- ============================================================================
-- Step 7: Lineage 검색용 헬퍼 함수들
-- ============================================================================

-- 특정 raw_import에서 파생된 모든 KPI 조회
CREATE OR REPLACE FUNCTION public.get_derived_kpis(
  p_raw_import_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{}';
  v_daily_kpis JSONB;
  v_zone_metrics JSONB;
BEGIN
  -- daily_kpis_agg에서 조회
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'date', date,
      'store_id', store_id,
      'total_revenue', total_revenue
    )
  )
  INTO v_daily_kpis
  FROM daily_kpis_agg
  WHERE source_trace -> 'raw_import_ids' ? p_raw_import_id::TEXT;

  -- zone_daily_metrics에서 조회
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'date', date,
      'zone_id', zone_id,
      'zone_name', zone_name
    )
  )
  INTO v_zone_metrics
  FROM zone_daily_metrics
  WHERE source_trace -> 'raw_import_ids' ? p_raw_import_id::TEXT;

  v_result := jsonb_build_object(
    'raw_import_id', p_raw_import_id,
    'derived_kpis', jsonb_build_object(
      'daily_kpis_agg', COALESCE(v_daily_kpis, '[]'::jsonb),
      'zone_daily_metrics', COALESCE(v_zone_metrics, '[]'::jsonb)
    ),
    'queried_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_derived_kpis IS
'특정 raw_import에서 파생된 모든 L3 KPI 레코드 조회
- 데이터 영향도 분석에 활용
- 원본 데이터 수정/삭제 시 영향받는 KPI 파악';

GRANT EXECUTE ON FUNCTION public.get_derived_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_derived_kpis TO service_role;

-- ETL Run 히스토리 조회
CREATE OR REPLACE FUNCTION public.get_etl_history(
  p_store_id UUID DEFAULT NULL,
  p_etl_function TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'etl_function', etl_function,
      'status', status,
      'date_range_start', date_range_start,
      'date_range_end', date_range_end,
      'input_record_count', input_record_count,
      'output_record_count', output_record_count,
      'duration_ms', duration_ms,
      'started_at', started_at,
      'completed_at', completed_at
    ) ORDER BY started_at DESC
  )
  INTO v_result
  FROM (
    SELECT *
    FROM etl_runs
    WHERE (p_store_id IS NULL OR store_id = p_store_id)
      AND (p_etl_function IS NULL OR etl_function = p_etl_function)
    ORDER BY started_at DESC
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object(
    'success', true,
    'etl_runs', COALESCE(v_result, '[]'::jsonb),
    'filters', jsonb_build_object(
      'store_id', p_store_id,
      'etl_function', p_etl_function,
      'limit', p_limit
    ),
    'queried_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.get_etl_history IS
'ETL 실행 히스토리 조회
- 특정 스토어 또는 ETL 함수별 필터링 가능
- 처리 성능 모니터링 및 디버깅에 활용';

GRANT EXECUTE ON FUNCTION public.get_etl_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_etl_history TO service_role;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================

-- 1. source_trace 컬럼 추가 확인
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'source_trace'
  AND table_schema = 'public'
ORDER BY table_name;

-- 2. etl_runs 테이블 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'etl_runs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 인덱스 확인
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE indexname LIKE '%source_trace%' OR tablename = 'etl_runs'
ORDER BY tablename, indexname;
