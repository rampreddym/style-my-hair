-- Add tip_amount column to appointments table for storing customer tips
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;

-- The google_place_id column already exists on stylists table (verified in schema)