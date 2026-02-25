-- Allow users to delete their own 3D model files stored under a user_id/store_id/filename path
-- without breaking existing org_id/store_id based policies.

CREATE POLICY "Users can delete own 3d models (user folder)"
ON storage.objects
FOR DELETE
USING (
  bucket_id = '3d-models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
