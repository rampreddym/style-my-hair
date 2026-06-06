
-- 1) launch_waitlist: remove public read
DROP POLICY IF EXISTS "Anyone can view waitlist entries" ON public.launch_waitlist;

CREATE OR REPLACE FUNCTION public.get_waitlist_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.launch_waitlist;
$$;

CREATE OR REPLACE FUNCTION public.get_waitlist_referral(_email text)
RETURNS TABLE(referral_code text, referral_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT referral_code, referral_count
  FROM public.launch_waitlist
  WHERE email = lower(trim(_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_waitlist_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_waitlist_referral(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_referral(text) TO anon, authenticated;

-- 2) stylists: hide Stripe / onboarding internals via column-level grants
REVOKE SELECT ON public.stylists FROM anon, authenticated;
GRANT SELECT (
  id, email, phone, name, business_name, bio, specialties, photo_url,
  latitude, longitude, address, google_place_id, rating, total_reviews,
  created_at, updated_at, user_id, onboarding_completed,
  years_experience, certifications, availability_status, language_preference
) ON public.stylists TO authenticated;
GRANT SELECT (
  id, name, business_name, bio, specialties, photo_url,
  latitude, longitude, address, rating, total_reviews,
  onboarding_completed, years_experience, certifications, availability_status
) ON public.stylists TO anon;

-- Stylist self-service definer for Stripe/onboarding fields
CREATE OR REPLACE FUNCTION public.get_my_stylist_stripe_status()
RETURNS TABLE(
  stripe_account_id text,
  stripe_onboarded boolean,
  onboarding_step integer,
  onboarding_completed boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stripe_account_id, stripe_onboarded, onboarding_step, onboarding_completed
  FROM public.stylists
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_my_stylist_stripe_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_stylist_stripe_status() TO authenticated;

-- 3) is_stylist_for_customer: filter by active appointment statuses
CREATE OR REPLACE FUNCTION public.is_stylist_for_customer(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stylists s
    JOIN public.appointments a ON a.stylist_id = s.id
    WHERE s.user_id = auth.uid()
      AND a.customer_id = _customer_id
      AND a.status IN ('confirmed', 'pending', 'completed')
  )
$$;
