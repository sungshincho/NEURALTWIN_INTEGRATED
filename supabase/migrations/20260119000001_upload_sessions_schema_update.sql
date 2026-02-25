-- ============================================================================
-- upload_sessions 테이블 스키마 업데이트
-- Edge Function에서 필요한 컬럼 추가
-- ============================================================================

-- 새로운 컬럼 추가 (IF NOT EXISTS 사용하여 안전하게)
DO $$
BEGIN
  -- org_id 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'org_id') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN org_id uuid;
  END IF;

  -- file_name 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'file_name') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN file_name text;
  END IF;

  -- file_path 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'file_path') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN file_path text;
  END IF;

  -- file_size 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'file_size') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN file_size bigint;
  END IF;

  -- file_type 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'file_type') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN file_type text;
  END IF;

  -- import_type 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'import_type') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN import_type text;
  END IF;

  -- target_table 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'target_table') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN target_table text;
  END IF;

  -- updated_at 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'upload_sessions' AND column_name = 'updated_at') THEN
    ALTER TABLE public.upload_sessions ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- 인덱스 추가 (import_type으로 검색 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_upload_sessions_import_type
ON public.upload_sessions(import_type);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_org_id
ON public.upload_sessions(org_id);

-- org_id에 대한 외래키 제약 (organizations 테이블이 있는 경우)
-- ALTER TABLE public.upload_sessions
-- ADD CONSTRAINT upload_sessions_org_id_fkey
-- FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.upload_sessions.org_id IS '조직 ID';
COMMENT ON COLUMN public.upload_sessions.file_name IS '업로드된 파일명';
COMMENT ON COLUMN public.upload_sessions.file_path IS 'Storage 내 파일 경로';
COMMENT ON COLUMN public.upload_sessions.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN public.upload_sessions.file_type IS '파일 확장자 (csv, xlsx, json 등)';
COMMENT ON COLUMN public.upload_sessions.import_type IS '임포트 타입 (products, customers, transactions 등)';
COMMENT ON COLUMN public.upload_sessions.target_table IS '데이터가 저장될 테이블명';
COMMENT ON COLUMN public.upload_sessions.updated_at IS '마지막 업데이트 시간';
