-- Add storage policies for user-photos bucket
CREATE POLICY "Allow public uploads to user-photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Allow public reads from user-photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-photos');

CREATE POLICY "Allow public updates to user-photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-photos');

CREATE POLICY "Allow public deletes from user-photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-photos');