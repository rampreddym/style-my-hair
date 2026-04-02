
CREATE TABLE public.launch_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  referral_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by TEXT,
  referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
ON public.launch_waitlist
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist entries"
ON public.launch_waitlist
FOR SELECT
USING (true);

CREATE POLICY "Update referral counts"
ON public.launch_waitlist
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.increment_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.launch_waitlist
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_waitlist_signup_referral
AFTER INSERT ON public.launch_waitlist
FOR EACH ROW
EXECUTE FUNCTION public.increment_referral_count();
