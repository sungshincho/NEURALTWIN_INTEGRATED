-- ============================================================================
-- MIGRATION: raw_imports 테이블 활성화
-- 목적: CTO 요구사항 "Raw data는 반드시 보존 (replay 가능)" 충족
-- 작성일: 2026-01-13
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: raw_imports 테이블에 추가 컬럼 추가 (user_data_imports 호환)
-- ============================================================================

-- raw_data: 원본 데이터 (JSON 배열)
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS raw_data JSONB;

COMMENT ON COLUMN public.raw_imports.raw_data IS '원본 데이터 (JSON 배열 또는 첫 N행 샘플)';

-- progress: 처리 진행 상황
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{"current": 0, "total": 0, "percentage": 0}'::jsonb;

COMMENT ON COLUMN public.raw_imports.progress IS '처리 진행 상황 {current, total, percentage}';

-- error_details: 상세 에러 정보
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS error_details JSONB;

COMMENT ON COLUMN public.raw_imports.error_details IS '상세 에러 정보 (스택 트레이스, 실패 행 등)';

-- started_at: 처리 시작 시간
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN public.raw_imports.started_at IS 'ETL 처리 시작 시간';

-- completed_at: 처리 완료 시간
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.raw_imports.completed_at IS 'ETL 처리 완료 시간';

-- data_type: 데이터 유형 (customers, products, purchases 등)
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS data_type TEXT;

COMMENT ON COLUMN public.raw_imports.data_type IS '데이터 유형 (customers, products, purchases, visits, staff 등)';

-- etl_version: ETL 버전
ALTER TABLE public.raw_imports
ADD COLUMN IF NOT EXISTS etl_version TEXT DEFAULT '2.0';

COMMENT ON COLUMN public.raw_imports.etl_version IS 'ETL 처리 버전';

-- ============================================================================
-- Step 2: 기존 user_data_imports 데이터를 raw_imports로 마이그레이션
-- ============================================================================

-- user_data_imports 테이블이 존재하는 경우에만 마이그레이션 실행
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_data_imports' AND table_schema = 'public') THEN
    INSERT INTO public.raw_imports (
      id,
      org_id,
      store_id,
      user_id,
      source_type,
      source_name,
      row_count,
      status,
      error_message,
      metadata,
      raw_data,
      progress,
      error_details,
      created_at,
      processed_at,
      started_at,
      completed_at,
      data_type
    )
    SELECT
      udi.id,
      udi.org_id,
      udi.store_id,
      udi.user_id,
      COALESCE(udi.data_type, 'unknown') as source_type,
      udi.file_name as source_name,
      udi.row_count,
      udi.status,
      udi.error_message,
      '{}'::jsonb as metadata,  -- user_data_imports에 metadata 컬럼 없음
      udi.raw_data,
      udi.progress,
      udi.error_details,
      udi.created_at,
      udi.updated_at as processed_at,
      udi.started_at,
      udi.completed_at,
      udi.data_type
    FROM public.user_data_imports udi
    WHERE NOT EXISTS (
      SELECT 1 FROM public.raw_imports ri WHERE ri.id = udi.id
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migrated data from user_data_imports to raw_imports';
  ELSE
    RAISE NOTICE 'user_data_imports table does not exist, skipping migration';
  END IF;
END $$;

-- ============================================================================
-- Step 3: 추가 인덱스 생성
-- ============================================================================

-- source_type 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_imports_source_type
ON public.raw_imports(source_type);

-- data_type 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_imports_data_type
ON public.raw_imports(data_type);

-- created_at 인덱스 (최근 데이터 조회용)
CREATE INDEX IF NOT EXISTS idx_raw_imports_created_at
ON public.raw_imports(created_at DESC);

-- user_id 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_imports_user_id
ON public.raw_imports(user_id);

-- status + created_at 복합 인덱스 (처리 대기 목록 조회용)
CREATE INDEX IF NOT EXISTS idx_raw_imports_status_created
ON public.raw_imports(status, created_at DESC);

-- metadata GIN 인덱스 (JSONB 검색용)
CREATE INDEX IF NOT EXISTS idx_raw_imports_metadata
ON public.raw_imports USING GIN (metadata);

-- ============================================================================
-- Step 4: 메타데이터 테이블 코멘트 추가
-- ============================================================================

COMMENT ON TABLE public.raw_imports IS
'L1 Raw Layer - 원본 데이터 보존 테이블
CTO 요구사항: "Raw data는 반드시 보존 (replay 가능)"
- 모든 CSV 업로드, API 동기화, 수동 입력의 원본 기록
- ETL 처리 상태 추적
- Data Lineage의 시작점';

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================

-- 1. 컬럼 추가 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'raw_imports'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 마이그레이션 결과 확인
SELECT
  'raw_imports' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT source_type) as source_types,
  COUNT(DISTINCT data_type) as data_types,
  COUNT(CASE WHEN raw_data IS NOT NULL THEN 1 END) as with_raw_data
FROM public.raw_imports;

-- 3. 인덱스 확인
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'raw_imports'
  AND schemaname = 'public';
