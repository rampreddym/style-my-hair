-- Add policy for public access to stylist profile photos
CREATE POLICY "Public view stylist profile photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-photos' 
  AND (storage.foldername(name))[2] = 'stylist-photos'
);