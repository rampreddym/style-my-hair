-- Fix 1 & 2: Customers table RLS policies
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public read access for customers" ON public.customers;
DROP POLICY IF EXISTS "Public insert access for customers" ON public.customers;
DROP POLICY IF EXISTS "Public update access for customers" ON public.customers;

-- Create secure owner-only policies
CREATE POLICY "Customers can view own record"
ON public.customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Stylists can view appointment customers"
ON public.customers FOR SELECT
USING (auth.uid() IN (
  SELECT s.user_id FROM stylists s
  JOIN appointments a ON a.stylist_id = s.id
  WHERE a.customer_id = customers.id
));

CREATE POLICY "Users can create own customer record"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update own record"
ON public.customers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 4: Storage bucket policies for user-photos
DROP POLICY IF EXISTS "Allow public uploads to user-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from user-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to user-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from user-photos" ON storage.objects;

-- Users can upload to their own folder
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

-- Allow public read for stylist portfolio photos (needed for booking flow)
CREATE POLICY "Public read stylist portfolios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[2] = 'portfolio'
);