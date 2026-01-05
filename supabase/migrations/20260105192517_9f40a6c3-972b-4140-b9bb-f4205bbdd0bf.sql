-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.stylist_services(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  status TEXT NOT NULL DEFAULT 'active',
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Customers can view their own waitlist entries
CREATE POLICY "Customers can view their own waitlist"
ON public.waitlist
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM customers WHERE id = customer_id));

-- Customers can add to their own waitlist
CREATE POLICY "Customers can add to waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM customers WHERE id = customer_id));

-- Customers can update their own waitlist entries
CREATE POLICY "Customers can update their own waitlist"
ON public.waitlist
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM customers WHERE id = customer_id));

-- Customers can delete their own waitlist entries
CREATE POLICY "Customers can delete from waitlist"
ON public.waitlist
FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM customers WHERE id = customer_id));

-- Stylists can view waitlist for their services
CREATE POLICY "Stylists can view waitlist for their services"
ON public.waitlist
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM stylists WHERE id = stylist_id));

-- Create trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at
BEFORE UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for waitlist notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;