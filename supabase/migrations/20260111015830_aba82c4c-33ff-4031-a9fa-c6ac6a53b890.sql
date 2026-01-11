-- Create a security definer function to check customer ownership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_customer_owner(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE id = _customer_id
      AND user_id = auth.uid()
  )
$$;

-- Drop existing policies on customer_photos that cause recursion
DROP POLICY IF EXISTS "Customers manage own photos" ON public.customer_photos;

-- Recreate with security definer function
CREATE POLICY "Customers manage own photos" 
ON public.customer_photos 
FOR ALL 
USING (public.is_customer_owner(customer_id))
WITH CHECK (public.is_customer_owner(customer_id));

-- Also fix customer_generated_styles which has similar pattern
DROP POLICY IF EXISTS "Customers manage own generated styles" ON public.customer_generated_styles;

CREATE POLICY "Customers manage own generated styles" 
ON public.customer_generated_styles 
FOR ALL 
USING (public.is_customer_owner(customer_id))
WITH CHECK (public.is_customer_owner(customer_id));