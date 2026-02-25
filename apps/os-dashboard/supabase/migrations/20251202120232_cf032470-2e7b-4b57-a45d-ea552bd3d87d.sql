-- Allow users to delete their own store-data files stored under a user_id/store_id/filename path
-- without breaking existing org_id/store_id based delete policy.

CREATE POLICY "Users can delete own store data (user folder)"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'store-data'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
