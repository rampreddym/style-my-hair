-- Fix Issue 1: Stylist Data Exposure
-- Create a public view with only safe fields for public browsing

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public read access for stylists" ON public.stylists;

-- Create public view with safe fields only (excludes sensitive data)
CREATE OR REPLACE VIEW public.stylists_public AS
SELECT 
  id,
  name,
  business_name,
  bio,
  specialties,
  certifications,
  photo_url,
  years_experience,
  rating,
  total_reviews,
  availability_status,
  onboarding_completed,
  -- Mask precise location to general area (reduce precision to ~1km)
  ROUND(latitude::numeric, 2) as latitude,
  ROUND(longitude::numeric, 2) as longitude,
  -- Provide general location context
  address
FROM public.stylists
WHERE onboarding_completed = true;

-- Grant public access to the safe view
GRANT SELECT ON public.stylists_public TO anon, authenticated;

-- Stylists can view their own full record
CREATE POLICY "Stylists view own full record"
ON public.stylists FOR SELECT
USING (auth.uid() = user_id);

-- Customers with appointments can see their stylist's full contact info for coordination
CREATE POLICY "Appointment customers view stylist contact"
ON public.stylists FOR SELECT
USING (
  auth.uid() IN (
    SELECT c.user_id FROM customers c
    JOIN appointments a ON a.customer_id = c.id
    WHERE a.stylist_id = stylists.id
    AND a.status IN ('confirmed', 'pending', 'completed')
  )
);