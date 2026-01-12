-- Fix the recursive policy on customers table
-- The "Stylists can view appointment customers" policy references customers.id which causes recursion

DROP POLICY IF EXISTS "Stylists can view appointment customers" ON public.customers;

-- Recreate using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_stylist_for_customer(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stylists s
    JOIN public.appointments a ON a.stylist_id = s.id
    WHERE s.user_id = auth.uid()
      AND a.customer_id = _customer_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Stylists can view appointment customers" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.is_stylist_for_customer(id)
);