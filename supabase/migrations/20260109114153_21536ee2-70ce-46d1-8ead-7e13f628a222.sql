-- Fix reviews RLS: require ownership and appointment verification
DROP POLICY IF EXISTS "Public insert access for reviews" ON public.reviews;

-- Customers can only create reviews for their own completed appointments
CREATE POLICY "Customers create appointment reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  -- Must be authenticated customer
  auth.uid() IN (
    SELECT c.user_id FROM customers c
    WHERE c.id = customer_id
  )
  -- Must have completed appointment with this stylist
  AND (
    appointment_id IS NULL 
    OR appointment_id IN (
      SELECT a.id FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      WHERE c.user_id = auth.uid()
      AND a.stylist_id = reviews.stylist_id
      AND a.status = 'completed'
    )
  )
);

-- Customers can update their own reviews
CREATE POLICY "Customers update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM customers WHERE id = customer_id
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM customers WHERE id = customer_id
));

-- Customers can delete their own reviews
CREATE POLICY "Customers delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() IN (
  SELECT user_id FROM customers WHERE id = customer_id
));

-- Fix stylists RLS: restrict INSERT/UPDATE to owner only
DROP POLICY IF EXISTS "Public insert access for stylists" ON public.stylists;
DROP POLICY IF EXISTS "Public update access for stylists" ON public.stylists;

-- Only stylist owner can create their profile
CREATE POLICY "Stylists create own profile"
ON public.stylists FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only stylist owner can update their profile
CREATE POLICY "Stylists update own profile"
ON public.stylists FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);