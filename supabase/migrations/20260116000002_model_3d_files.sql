-- ============================================================================
-- 3D Model Files Table and Storage
-- Phase 3: Digital Twin Studio용 3D 모델 관리
-- ============================================================================

-- 1. 3D 모델 파일 메타데이터 테이블
CREATE TABLE IF NOT EXISTS public.model_3d_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- 'glb', 'gltf', 'fbx', 'obj', 'dae'
  display_name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'ready', -- 'uploading', 'processing', 'ready', 'error'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_model_3d_files_user_id ON public.model_3d_files(user_id);
CREATE INDEX IF NOT EXISTS idx_model_3d_files_store_id ON public.model_3d_files(store_id);
CREATE INDEX IF NOT EXISTS idx_model_3d_files_status ON public.model_3d_files(status);

-- 3. RLS 정책
ALTER TABLE public.model_3d_files ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 데이터 접근
CREATE POLICY "Users can access own 3D models"
ON public.model_3d_files FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. 3D 모델 Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models',
  '3d-models',
  false,
  104857600, -- 100MB
  ARRAY[
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'application/x-fbx',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS 정책
-- 사용자 본인 파일만 업로드
CREATE POLICY "Users can upload own 3D models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자 본인 파일만 조회
CREATE POLICY "Users can view own 3D models"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자 본인 파일만 삭제
CREATE POLICY "Users can delete own 3D models"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. user_data_imports 테이블에 롤백 관련 컬럼 추가 (Phase 3)
ALTER TABLE public.user_data_imports
ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rolled_back_rows INTEGER;

-- 7. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_model_3d_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_model_3d_files_updated_at ON public.model_3d_files;
CREATE TRIGGER trigger_model_3d_files_updated_at
BEFORE UPDATE ON public.model_3d_files
FOR EACH ROW
EXECUTE FUNCTION update_model_3d_files_updated_at();

-- 8. 댓글/코멘트
COMMENT ON TABLE public.model_3d_files IS '3D 모델 파일 메타데이터 (Digital Twin Studio용)';
COMMENT ON COLUMN public.model_3d_files.file_type IS 'glb, gltf, fbx, obj, dae';
COMMENT ON COLUMN public.model_3d_files.status IS 'uploading, processing, ready, error';
