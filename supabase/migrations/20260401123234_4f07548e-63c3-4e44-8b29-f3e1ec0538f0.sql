DROP POLICY IF EXISTS "Allow users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;

CREATE POLICY "Allow users to upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read their own photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow public read photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'user-photos');

CREATE POLICY "Allow users to delete their own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );