-- Drop existing tables to rebuild schema
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS hairstyle_requests CASCADE;
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS stylists CASCADE;

-- Create customers table (public access, identified by email/phone)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER,
  preferred_style_description TEXT,
  preferred_style_category TEXT,
  stripe_customer_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create customer photos table
CREATE TABLE public.customer_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL, -- front, sides, back, top
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stylists table
CREATE TABLE public.stylists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  business_name TEXT,
  bio TEXT,
  specialties TEXT[],
  photo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT FALSE,
  google_place_id TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create hair styles reference table
CREATE TABLE public.hair_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL, -- male, female, unisex
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stylist services table
CREATE TABLE public.stylist_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI generated styles for customers
CREATE TABLE public.customer_generated_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  style_prompt TEXT NOT NULL,
  generated_image_url TEXT,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.stylist_services(id) ON DELETE CASCADE,
  generated_style_id UUID REFERENCES public.customer_generated_styles(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  price NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  ai_style_description TEXT, -- AI generated description for stylist
  stylist_notes TEXT, -- Notes from stylist after service
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_google_review BOOLEAN DEFAULT FALSE,
  google_review_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hair_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_generated_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required)
CREATE POLICY "Public read access for customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public insert access for customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for customers" ON public.customers FOR UPDATE USING (true);

CREATE POLICY "Public read access for customer_photos" ON public.customer_photos FOR SELECT USING (true);
CREATE POLICY "Public insert access for customer_photos" ON public.customer_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete access for customer_photos" ON public.customer_photos FOR DELETE USING (true);

CREATE POLICY "Public read access for stylists" ON public.stylists FOR SELECT USING (true);
CREATE POLICY "Public insert access for stylists" ON public.stylists FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for stylists" ON public.stylists FOR UPDATE USING (true);

CREATE POLICY "Public read access for hair_styles" ON public.hair_styles FOR SELECT USING (true);

CREATE POLICY "Public read access for stylist_services" ON public.stylist_services FOR SELECT USING (true);
CREATE POLICY "Public insert access for stylist_services" ON public.stylist_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for stylist_services" ON public.stylist_services FOR UPDATE USING (true);
CREATE POLICY "Public delete access for stylist_services" ON public.stylist_services FOR DELETE USING (true);

CREATE POLICY "Public read access for customer_generated_styles" ON public.customer_generated_styles FOR SELECT USING (true);
CREATE POLICY "Public insert access for customer_generated_styles" ON public.customer_generated_styles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for customer_generated_styles" ON public.customer_generated_styles FOR UPDATE USING (true);

CREATE POLICY "Public read access for appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public insert access for appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for appointments" ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Public read access for reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public insert access for reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Insert default hair styles
INSERT INTO public.hair_styles (name, gender, description) VALUES
('Buzz Cut', 'male', 'Short, uniform length all over'),
('Fade', 'male', 'Gradual transition from short to longer'),
('Undercut', 'male', 'Short sides with longer top'),
('Pompadour', 'male', 'Voluminous top swept back'),
('Crew Cut', 'male', 'Short on sides, slightly longer on top'),
('Quiff', 'male', 'Volume at front, swept up and back'),
('Man Bun', 'male', 'Long hair tied in bun'),
('Slick Back', 'male', 'Combed back with product'),
('Bob Cut', 'female', 'Chin-length, even all around'),
('Pixie Cut', 'female', 'Short, layered, textured'),
('Layers', 'female', 'Multiple lengths for volume'),
('Bangs/Fringe', 'female', 'Hair cut to cover forehead'),
('Lob', 'female', 'Long bob, shoulder length'),
('Beach Waves', 'female', 'Loose, natural-looking waves'),
('Braids', 'female', 'Various braiding styles'),
('Updo', 'female', 'Hair styled up and away'),
('Mohawk', 'unisex', 'Shaved sides with strip in middle'),
('Shag', 'unisex', 'Layered with volume'),
('Afro', 'unisex', 'Natural curly volume'),
('Dreadlocks', 'unisex', 'Matted rope-like strands');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stylists_updated_at
  BEFORE UPDATE ON public.stylists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();