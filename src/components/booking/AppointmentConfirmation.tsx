import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentConfirmationProps {
  appointmentId: string;
  appointmentDate: string;
  stylistName: string;
  stylistAddress?: string;
  onConfirm: () => void;
}

export const AppointmentConfirmation = ({
  appointmentId,
  appointmentDate,
  stylistName,
  stylistAddress,
  onConfirm,
}: AppointmentConfirmationProps) => {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const confirmAttendance = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          check_in_status: "confirmed",
          customer_confirmed_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      setConfirmed(true);
      toast({ title: "Attendance confirmed!" });
      onConfirm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const appointmentTime = new Date(appointmentDate);
  const now = new Date();
  const hoursUntil = Math.round((appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Card className={cn(
      "border-2",
      confirmed ? "border-green-500 bg-green-50" : "border-primary"
    )}>
      <CardContent className="p-6 text-center space-y-4">
        {confirmed ? (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700">See You Soon!</h3>
              <p className="text-muted-foreground text-sm">
                {stylistName} is ready for you.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Confirm Your Appointment</h3>
              <p className="text-muted-foreground text-sm">
                Your appointment with {stylistName} is in {hoursUntil} hours
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {appointmentTime.toLocaleDateString()} at{" "}
                  {appointmentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {stylistAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{stylistAddress}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Handle reschedule
                  toast({ title: "Reschedule feature coming soon!" });
                }}
              >
                Reschedule
              </Button>
              <Button
                onClick={confirmAttendance}
                disabled={confirming}
                className="flex-1 bg-gradient-to-r from-accent to-primary"
              >
                {confirming ? "Confirming..." : "Yes, I'm Coming!"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
