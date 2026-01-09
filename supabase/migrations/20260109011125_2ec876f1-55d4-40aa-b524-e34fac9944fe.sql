-- Fix customer_photos RLS policies - replace public access with owner and appointment-based access

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Public read access for customer_photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Public insert access for customer_photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Public delete access for customer_photos" ON public.customer_photos;

-- Customers can manage their own photos (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Customers manage own photos"
ON public.customer_photos FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM customers WHERE id = customer_id
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM customers WHERE id = customer_id
));

-- Stylists with appointments can view customer photos
CREATE POLICY "Stylists view appointment customer photos"
ON public.customer_photos FOR SELECT
USING (auth.uid() IN (
  SELECT s.user_id FROM stylists s
  JOIN appointments a ON a.stylist_id = s.id
  WHERE a.customer_id = customer_photos.customer_id
));

-- Fix storage policies to work with user_id folder structure
-- Drop old policies that check for user_id as first folder (they'll be replaced)
DROP POLICY IF EXISTS "Users upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own photos" ON storage.objects;

-- Users can upload to their own folder (user_id/category/filename)
CREATE POLICY "Users upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own photos
CREATE POLICY "Users view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photos
CREATE POLICY "Users update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Portfolio photos remain publicly viewable (for stylist browsing)
DROP POLICY IF EXISTS "Public view portfolio photos" ON storage.objects;
CREATE POLICY "Public view portfolio photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[2] = 'portfolio-photos'
);