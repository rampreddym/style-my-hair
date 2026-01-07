-- Add language_preference column to customers table
ALTER TABLE public.customers 
ADD COLUMN language_preference text DEFAULT 'en';

-- Add language_preference column to stylists table
ALTER TABLE public.stylists 
ADD COLUMN language_preference text DEFAULT 'en';