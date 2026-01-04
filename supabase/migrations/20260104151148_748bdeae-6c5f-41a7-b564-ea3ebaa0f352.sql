-- Create messages table for in-app messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_image BOOLEAN DEFAULT false,
  image_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages - users can see their own messages
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can mark messages as read"
ON public.messages
FOR UPDATE
USING (auth.uid() = to_user_id);

-- Create appointment feedback table for post-appointment surveys
CREATE TABLE public.appointment_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('love', 'happy', 'okay', 'not_great', 'upset')),
  feedback_text TEXT,
  issue_type TEXT,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'escalated', 'refunded', 'touchup')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(appointment_id)
);

-- Enable RLS on appointment feedback
ALTER TABLE public.appointment_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Customers can create their own feedback"
ON public.appointment_feedback
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.customers WHERE id = customer_id));

CREATE POLICY "Users can view feedback for their appointments"
ON public.appointment_feedback
FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM public.customers WHERE id = customer_id) OR
  auth.uid() IN (SELECT user_id FROM public.stylists WHERE id = (SELECT stylist_id FROM public.appointments WHERE id = appointment_id))
);

-- Add no-show tracking columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'pending' CHECK (check_in_status IN ('pending', 'confirmed', 'arrived', 'no_show')),
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create customer no-show tracking table
CREATE TABLE public.customer_no_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  no_show_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fee_charged DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on no-shows
ALTER TABLE public.customer_no_shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists can view no-shows for their appointments"
ON public.customer_no_shows
FOR SELECT
USING (auth.uid() IN (
  SELECT s.user_id FROM public.stylists s
  JOIN public.appointments a ON a.stylist_id = s.id
  WHERE a.id = appointment_id
));

-- Add onboarding tracking columns to stylists table
ALTER TABLE public.stylists
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'offline' CHECK (availability_status IN ('online', 'busy', 'offline'));

-- Create stylist portfolio table for better portfolio management
CREATE TABLE public.stylist_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  hair_type TEXT,
  style_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on portfolio
ALTER TABLE public.stylist_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolios"
ON public.stylist_portfolio
FOR SELECT
USING (true);

CREATE POLICY "Stylists can manage their own portfolio"
ON public.stylist_portfolio
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.stylists WHERE id = stylist_id));

-- Create stylist availability table
CREATE TABLE public.stylist_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stylist_id, day_of_week)
);

-- Enable RLS on availability
ALTER TABLE public.stylist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
ON public.stylist_availability
FOR SELECT
USING (true);

CREATE POLICY "Stylists can manage their own availability"
ON public.stylist_availability
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.stylists WHERE id = stylist_id));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;