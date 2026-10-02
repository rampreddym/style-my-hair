-- Protect payment fields: only the backend (service role) may set them
CREATE OR REPLACE FUNCTION public.protect_appointment_payment_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _min numeric;
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status IS NULL OR NEW.payment_status NOT IN ('pending','pay_later','unpaid') THEN
      NEW.payment_status := 'pending';
    END IF;
    NEW.stripe_payment_intent_id := NULL;
    SELECT price INTO _min FROM public.stylist_services WHERE id = NEW.service_id AND stylist_id = NEW.stylist_id;
    IF _min IS NULL THEN
      RAISE EXCEPTION 'Invalid service for this stylist';
    END IF;
    IF NEW.price IS NULL OR NEW.price < _min THEN
      RAISE EXCEPTION 'Appointment price is below the service price';
    END IF;
    IF NEW.tip_amount IS NULL OR NEW.tip_amount < 0 THEN NEW.tip_amount := 0; END IF;
    IF NEW.tip_amount > NEW.price * 2 THEN RAISE EXCEPTION 'Tip amount too large'; END IF;
  ELSE
    NEW.payment_status := OLD.payment_status;
    NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
    NEW.price := OLD.price;
    NEW.tip_amount := OLD.tip_amount;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_appointment_payment_fields ON public.appointments;
CREATE TRIGGER protect_appointment_payment_fields
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.protect_appointment_payment_fields();

-- Respect the customer's AI-style sharing preference
DROP POLICY IF EXISTS "Stylists view appointment generated styles" ON public.customer_generated_styles;
CREATE POLICY "Stylists view appointment generated styles"
ON public.customer_generated_styles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stylists s
    JOIN public.appointments a ON a.stylist_id = s.id
    JOIN public.customers c ON c.id = customer_generated_styles.customer_id
    WHERE s.user_id = auth.uid()
      AND a.generated_style_id = customer_generated_styles.id
      AND coalesce(c.share_ai_styles_with_stylist, true) = true
  )
);

-- Waitlist: validate submissions instead of accepting anything
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.launch_waitlist;
CREATE POLICY "Anyone can join the waitlist"
ON public.launch_waitlist FOR INSERT TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(email) <= 255
  AND (name IS NULL OR length(name) <= 100)
  AND referral_count = 0
  AND (referred_by IS NULL OR length(referred_by) <= 32)
);

-- Storage: public bucket serves files by URL; remove broad listing rules
DROP POLICY IF EXISTS "Public read stylist portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Public view stylist profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public view portfolio photos" ON storage.objects;