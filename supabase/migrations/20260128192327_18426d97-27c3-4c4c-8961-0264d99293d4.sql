-- Add column for AI-generated stylist instructions
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS stylist_instructions TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.stylist_instructions IS 'AI-generated professional hairstylist instructions for executing the requested style';