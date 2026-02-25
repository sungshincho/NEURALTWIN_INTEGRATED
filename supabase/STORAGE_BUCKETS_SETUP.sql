-- ============================================================================
-- NEURALTWIN Storage Buckets Setup
-- 새 Supabase 프로젝트용 (bdrvowacecxnraaivlhr)
-- ============================================================================

-- 1. store-data 버킷 생성 (비공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-data', 'store-data', false)
ON CONFLICT (id) DO NOTHING;

-- 2. 3d-models 버킷 생성 (공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('3d-models', '3d-models', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage RLS Policies for store-data bucket (private)
-- ============================================================================

-- Users can view their own org's files in store-data
CREATE POLICY "Org members can view org store data"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'store-data' AND
  (
    -- Check if user owns the file directly
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Check if user is member of the org that owns the file
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Org members can upload files to their org folder
CREATE POLICY "Org members can upload org store data"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-data' AND
  (
    -- User can upload to their own folder
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- User can upload to their org folder
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Org members can update their org's files
CREATE POLICY "Org members can update org store data"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-data' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Org admins can delete their org's files
CREATE POLICY "Org admins can delete org store data"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-data' AND
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.org_id::text = (storage.foldername(name))[1]
      AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
);

-- ============================================================================
-- Storage RLS Policies for 3d-models bucket (public)
-- ============================================================================

-- Everyone can view 3d-models (public bucket)
CREATE POLICY "3D models are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = '3d-models');

-- Org members can upload 3D models to their org folder
CREATE POLICY "Org members can upload 3D models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '3d-models' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Org members can update their 3D models
CREATE POLICY "Org members can update their 3D models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = '3d-models' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Org admins can delete 3D models
CREATE POLICY "Org admins can delete 3D models"
ON storage.objects FOR DELETE
USING (
  bucket_id = '3d-models' AND
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.org_id::text = (storage.foldername(name))[1]
      AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
);

-- ============================================================================
-- Storage Setup Complete
-- ============================================================================
