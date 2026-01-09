-- Fix the SECURITY DEFINER view warning by recreating with explicit security invoker
DROP VIEW IF EXISTS public.stylists_public;

CREATE VIEW public.stylists_public 
WITH (security_invoker = true)
AS
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
  ROUND(latitude::numeric, 2) as latitude,
  ROUND(longitude::numeric, 2) as longitude,
  address
FROM public.stylists
WHERE onboarding_completed = true;

-- Grant public access to the safe view
GRANT SELECT ON public.stylists_public TO anon, authenticated;