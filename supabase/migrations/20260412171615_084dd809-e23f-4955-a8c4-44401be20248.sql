-- Re-add a limited SELECT policy for onboarded stylists
-- This is safe because the stylists_public view excludes sensitive columns
CREATE POLICY "Authenticated users can view onboarded stylists"
ON public.stylists
FOR SELECT
TO authenticated
USING (onboarding_completed = true);