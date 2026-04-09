import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  appointmentDate: string;
  stylistName: string;
  stylistId?: string;
  serviceId?: string;
  onCancelled: () => void;
}

export const CancelAppointmentDialog = ({
  open,
  onOpenChange,
  appointmentId,
  appointmentDate,
  stylistName,
  stylistId,
  serviceId,
  onCancelled,
}: CancelAppointmentDialogProps) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const appointmentTime = new Date(appointmentDate);
  const hoursUntil = (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const isLastMinute = hoursUntil < 24;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Notify waitlisted customers
      if (stylistId && serviceId) {
        supabase.functions.invoke("check-waitlist", {
          body: { stylistId, serviceId, appointmentDate },
        }).catch(console.error);
      }

      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      onCancelled();
    } catch (error: any) {
      toast({
        title: "Failed to cancel",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel your appointment with{" "}
              <strong>{stylistName}</strong> on{" "}
              <strong>
                {appointmentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </strong>{" "}
              at{" "}
              <strong>
                {appointmentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
              ?
            </p>
            {isLastMinute && (
              <p className="text-destructive font-medium">
                ⚠️ This is a last-minute cancellation (less than 24 hours before
                the appointment). A cancellation fee may apply.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelling}>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
