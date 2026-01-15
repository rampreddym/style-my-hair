-- Add policy to allow anyone to view public stylist data via the stylists_public view
-- This policy restricts access to only stylists who have completed onboarding
CREATE POLICY "Anyone can view onboarded stylists public info" 
ON public.stylists 
FOR SELECT 
USING (onboarding_completed = true);