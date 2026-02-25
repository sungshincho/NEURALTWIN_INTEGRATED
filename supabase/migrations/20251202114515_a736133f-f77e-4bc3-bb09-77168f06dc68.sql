-- Fix 3D models storage RLS policies to allow user_id based paths
-- This resolves the issue where files uploaded with user_id/store_id path structure
-- cannot be deleted due to RLS policy expecting org_id/store_id structure

-- Drop existing DELETE policy for 3d-models
DROP POLICY IF EXISTS "Org admins can delete 3D models" ON storage.objects;

-- Create new DELETE policy that supports both user_id and org_id based paths
CREATE POLICY "Org members can delete their 3D models"
ON storage.objects FOR DELETE
USING (
  bucket_id = '3d-models'
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow deletion if first folder is user's own user_id
    split_part(name, '/', 1) = auth.uid()::text
    OR
    -- Allow deletion if first folder is user's org_id and user is admin
    split_part(name, '/', 1) IN (
      SELECT org_id::text
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('ORG_HQ', 'ORG_ADMIN')
    )
  )
);

-- Also update UPDATE policy to match
DROP POLICY IF EXISTS "Org members can update their 3D models" ON storage.objects;

CREATE POLICY "Org members can update their 3D models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = '3d-models'
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow update if first folder is user's own user_id
    split_part(name, '/', 1) = auth.uid()::text
    OR
    -- Allow update if first folder is user's org_id
    split_part(name, '/', 1) IN (
      SELECT org_id::text
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);