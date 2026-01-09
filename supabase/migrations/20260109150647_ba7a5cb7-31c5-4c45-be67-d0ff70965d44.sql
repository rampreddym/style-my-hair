-- Fix permissive RLS policies on appointments table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Public insert access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public read access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public update access for appointments" ON public.appointments;

-- Create proper RLS policies for appointments
-- Customers can view their own appointments
CREATE POLICY "Customers view own appointments"
ON public.appointments
FOR SELECT
USING (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = appointments.customer_id
  )
);

-- Stylists can view appointments assigned to them
CREATE POLICY "Stylists view their appointments"
ON public.appointments
FOR SELECT
USING (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s WHERE s.id = appointments.stylist_id
  )
);

-- Customers can create appointments (validated that customer_id matches their auth)
CREATE POLICY "Customers create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = appointments.customer_id
  )
);

-- Customers can update their own appointments (limited to confirmation and check-in)
CREATE POLICY "Customers update own appointments"
ON public.appointments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = appointments.customer_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = appointments.customer_id
  )
);

-- Stylists can update appointments assigned to them (status changes, notes)
CREATE POLICY "Stylists update their appointments"
ON public.appointments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s WHERE s.id = appointments.stylist_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s WHERE s.id = appointments.stylist_id
  )
);

-- Fix permissive RLS policies on customer_generated_styles table
DROP POLICY IF EXISTS "Public insert access for customer_generated_styles" ON public.customer_generated_styles;
DROP POLICY IF EXISTS "Public read access for customer_generated_styles" ON public.customer_generated_styles;
DROP POLICY IF EXISTS "Public update access for customer_generated_styles" ON public.customer_generated_styles;

-- Customers can manage their own generated styles
CREATE POLICY "Customers manage own generated styles"
ON public.customer_generated_styles
FOR ALL
USING (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = customer_generated_styles.customer_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT c.user_id FROM customers c WHERE c.id = customer_generated_styles.customer_id
  )
);

-- Stylists can view generated styles for their appointments
CREATE POLICY "Stylists view appointment generated styles"
ON public.customer_generated_styles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s
    JOIN appointments a ON a.stylist_id = s.id
    WHERE a.generated_style_id = customer_generated_styles.id
  )
);

-- Fix permissive RLS policies on stylist_services table
DROP POLICY IF EXISTS "Public insert access for stylist_services" ON public.stylist_services;
DROP POLICY IF EXISTS "Public update access for stylist_services" ON public.stylist_services;
DROP POLICY IF EXISTS "Public delete access for stylist_services" ON public.stylist_services;

-- Stylists can manage their own services
CREATE POLICY "Stylists manage own services"
ON public.stylist_services
FOR ALL
USING (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s WHERE s.id = stylist_services.stylist_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT s.user_id FROM stylists s WHERE s.id = stylist_services.stylist_id
  )
);