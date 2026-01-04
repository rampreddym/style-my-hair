import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, Calendar, Clock, MapPin, Share2, Bell, 
  CalendarPlus, RefreshCw, MessageSquare 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingConfirmationProps {
  booking: {
    id: string;
    appointment_date: string;
    price: number;
    stylist: { name: string; address?: string; phone?: string };
    service: { name: string; duration_minutes: number };
  };
  onDone: () => void;
  onTryAnotherStyle: () => void;
}

export const BookingConfirmation = ({ 
  booking, 
  onDone, 
  onTryAnotherStyle 
}: BookingConfirmationProps) => {
  const { toast } = useToast();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  const appointmentDate = new Date(booking.appointment_date);

  const addToCalendar = () => {
    const startTime = appointmentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(appointmentDate.getTime() + booking.service.duration_minutes * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.service.name + ' with ' + booking.stylist.name)}&dates=${startTime}/${endTime}&details=${encodeURIComponent('Hair appointment booked via StyleMyHair')}&location=${encodeURIComponent(booking.stylist.address || '')}`;

    window.open(calendarUrl, '_blank');
    toast({ title: "Opening calendar...", description: "Add to your Google Calendar" });
  };

  const enableReminders = () => {
    setRemindersEnabled(true);
    toast({ 
      title: "Reminders enabled!", 
      description: "You'll receive reminders 24h, 6h, and 1h before your appointment" 
    });
  };

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
              <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground mt-2">Your appointment has been scheduled</p>
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

              {booking.stylist.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{booking.stylist.address}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 mt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${booking.price}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 flex-col py-2"
                onClick={addToCalendar}
              >
                <CalendarPlus className="w-4 h-4 mb-1" />
                <span className="text-xs">Add to Calendar</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-12 flex-col py-2 ${remindersEnabled ? 'border-primary bg-primary/5' : ''}`}
                onClick={enableReminders}
                disabled={remindersEnabled}
              >
                <Bell className={`w-4 h-4 mb-1 ${remindersEnabled ? 'text-primary' : ''}`} />
                <span className="text-xs">
                  {remindersEnabled ? 'Reminders On' : 'Turn On Reminders'}
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-12 flex-col py-2"
                onClick={shareBooking}
              >
                <Share2 className="w-4 h-4 mb-1" />
                <span className="text-xs">Share</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-12 flex-col py-2"
                onClick={() => {
                  toast({ title: "Coming soon!", description: "Reschedule feature is under development" });
                }}
              >
                <RefreshCw className="w-4 h-4 mb-1" />
                <span className="text-xs">Reschedule</span>
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
