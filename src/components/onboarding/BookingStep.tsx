import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, DollarSign, CheckCircle2 } from "lucide-react";

interface BookingStepProps {
  stylist: any;
  selectedImage: string;
  userId: string;
  stylePrompt: string;
  onBack: () => void;
}

const BookingStep = ({ stylist, selectedImage, userId, stylePrompt, onBack }: BookingStepProps) => {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const estimatedPrice = 85 + Math.floor(Math.random() * 40);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

      const { data: requestData, error: requestError } = await supabase
        .from('hairstyle_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('style_prompt', stylePrompt)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;

      const { error: bookingError } = await supabase.from('appointments').insert({
        user_id: userId,
        stylist_id: stylist.id,
        request_id: requestData?.id,
        appointment_date: appointmentDateTime.toISOString(),
        price: estimatedPrice,
        status: 'pending',
      });

      if (bookingError) throw bookingError;

      await supabase
        .from('hairstyle_requests')
        .update({ selected_image_url: selectedImage })
        .eq('id', requestData?.id);

      setBooked(true);
      toast({
        title: "Appointment booked!",
        description: "Your stylist will confirm your booking shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (booked) {
    return (
      <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">
            Your appointment with {stylist.name} has been submitted for confirmation.
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{appointmentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{appointmentTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>Estimated: ${estimatedPrice}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="w-full rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Book Your Appointment</h2>
        <p className="text-muted-foreground">Choose your preferred date and time</p>
      </div>

      <div className="mb-6">
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex gap-4 mb-3">
            <img
              src={stylist.photo_url}
              alt={stylist.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{stylist.name}</h3>
              <p className="text-sm text-muted-foreground">{stylist.location}</p>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden mb-3">
            <img
              src={selectedImage}
              alt="Selected style"
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>Estimated Price: ${estimatedPrice}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            type="button"
            variant="outline"
            disabled={loading}
            className="flex-1 rounded-xl h-12"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingStep;
