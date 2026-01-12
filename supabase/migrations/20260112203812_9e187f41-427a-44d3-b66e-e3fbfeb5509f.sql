-- Create SECURITY DEFINER function to check if customer has appointment with stylist
-- This breaks the RLS recursion loop
CREATE OR REPLACE FUNCTION public.is_customer_for_stylist(_stylist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers c
    JOIN public.appointments a ON a.customer_id = c.id
    WHERE c.user_id = auth.uid()
      AND a.stylist_id = _stylist_id
      AND a.status IN ('confirmed', 'pending', 'completed')
  )
$$;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Appointment customers view stylist contact" ON public.stylists;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Appointment customers view stylist contact"
ON public.stylists
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_customer_for_stylist(id)
);