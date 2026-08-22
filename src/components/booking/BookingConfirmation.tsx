import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, Calendar, Clock, Share2, Bell, 
  RefreshCw, MessageSquare, X 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StylistLocationLink } from "@/components/map/StylistLocationLink";

interface BookingConfirmationProps {
  booking: {
    id: string;
    appointment_date: string;
    price: number;
    stylist: { name: string; address?: string; phone?: string; latitude?: number; longitude?: number };
    service: { name: string; duration_minutes: number };
  };
  onDone: () => void;
  onTryAnotherStyle: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

export const BookingConfirmation = ({ 
  booking, 
  onDone, 
  onTryAnotherStyle,
  onCancel,
  onReschedule
}: BookingConfirmationProps) => {
  const { toast } = useToast();

  const appointmentDate = new Date(booking.appointment_date);

  // Auto-enable reminders on mount
  useEffect(() => {
    toast({ 
      title: "Reminders enabled", 
      description: "You'll be notified before your appointment",
      duration: 3000
    });
  }, []);

  const shareBooking = async () => {
    const shareText = `I just booked a ${booking.service.name} with ${booking.stylist.name} on ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}! 💇`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard!", description: "Share with your friends" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Card className="text-center border-0 shadow-lg">
          <CardContent className="pt-8 space-y-6">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-bounce-once">
              <Check className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground mt-2">Your appointment has been scheduled</p>
            </div>

            {/* Reminder indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Bell className="w-4 h-4" />
              <span>Reminders are on</span>
            </div>
            
            {/* Booking Details */}
            <div className="space-y-3 text-left bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {booking.stylist.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{booking.stylist.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.service.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{appointmentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}({booking.service.duration_minutes} min)
                </span>
              </div>

              {(booking.stylist.address || booking.stylist.latitude) && (
                <StylistLocationLink
                  address={booking.stylist.address}
                  latitude={booking.stylist.latitude}
                  longitude={booking.stylist.longitude}
                  stylistName={booking.stylist.name}
                  variant="card"
                />
              )}

              <div className="border-t border-border pt-3 mt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${booking.price}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="h-14 flex-col py-2"
                onClick={shareBooking}
              >
                <Share2 className="w-4 h-4 mb-1" />
                <span className="text-xs">Share</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-14 flex-col py-2"
                onClick={onReschedule}
              >
                <RefreshCw className="w-4 h-4 mb-1" />
                <span className="text-xs">Reschedule</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-14 flex-col py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onCancel}
              >
                <X className="w-4 h-4 mb-1" />
                <span className="text-xs">Cancel</span>
              </Button>
            </div>

            {/* Message Stylist */}
            {booking.stylist.phone && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(`sms:${booking.stylist.phone}`, '_blank')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Stylist
              </Button>
            )}

            {/* Primary Actions */}
            <div className="pt-4 space-y-3">
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90" 
                onClick={onDone}
              >
                Done
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={onTryAnotherStyle}
              >
                Try Another Style
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
