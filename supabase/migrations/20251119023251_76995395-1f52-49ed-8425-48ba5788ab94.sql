-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  gender text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user_photos table for uploaded images
CREATE TABLE public.user_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own photos"
  ON public.user_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON public.user_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create hairstyle_requests table
CREATE TABLE public.hairstyle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  style_prompt text NOT NULL,
  selected_image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hairstyle_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON public.hairstyle_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
  ON public.hairstyle_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.hairstyle_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Create stylists table
CREATE TABLE public.stylists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  rating numeric(3,2) DEFAULT 5.0,
  specialties text[] DEFAULT '{}',
  photo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stylists"
  ON public.stylists FOR SELECT
  TO authenticated
  USING (true);

-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stylist_id uuid REFERENCES public.stylists(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES public.hairstyle_requests(id) ON DELETE CASCADE NOT NULL,
  appointment_date timestamptz NOT NULL,
  price numeric(10,2),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert some sample stylists
INSERT INTO public.stylists (name, location, rating, specialties, photo_url) VALUES
  ('Emma Rodriguez', 'Downtown Salon, 123 Main St', 4.9, ARRAY['Modern Cuts', 'Color Specialist', 'Balayage'], 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400'),
  ('Michael Chen', 'Uptown Hair Studio, 456 Oak Ave', 4.8, ARRAY['Men''s Grooming', 'Fade Expert', 'Beard Styling'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
  ('Sofia Martinez', 'Elegance Hair Lounge, 789 Elm St', 5.0, ARRAY['Bridal Styling', 'Extensions', 'Keratin Treatments'], 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'),
  ('James Wilson', 'The Cut House, 321 Pine Rd', 4.7, ARRAY['Classic Cuts', 'Hot Towel Shaves', 'Hair Restoration'], 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400');

-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view uploaded photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-photos');