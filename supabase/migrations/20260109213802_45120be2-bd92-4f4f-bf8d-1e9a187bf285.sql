-- Add column for AI style sharing preference
ALTER TABLE public.customers 
ADD COLUMN share_ai_styles_with_stylist boolean DEFAULT true;