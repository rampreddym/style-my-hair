-- 1. Fix stylists: drop overly permissive public SELECT that exposes sensitive fields
-- The stylists_public view already provides safe public access
DROP POLICY IF EXISTS "Anyone can view onboarded stylists public info" ON public.stylists;

-- 2. Fix user_roles: restrict which roles users can self-assign
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('customer', 'stylist')
);

-- 3. Fix reviews: require authentication to read reviews
DROP POLICY IF EXISTS "Public read access for reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- 4. Fix storage: remove redundant overly-permissive policies
DROP POLICY IF EXISTS "Public can view uploaded photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos in public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read photos" ON storage.objects;

-- 5. Fix launch_waitlist: restrict UPDATE to only referral_count changes
DROP POLICY IF EXISTS "Update referral counts" ON public.launch_waitlist;
CREATE POLICY "Update referral counts via trigger only"
ON public.launch_waitlist
FOR UPDATE
USING (false)
WITH CHECK (false);
