import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  stylistId: string;
  stylistName: string;
  serviceDuration: number;
  currentDate: string;
  onRescheduled: () => void;
}

export const RescheduleDialog = ({
  open,
  onOpenChange,
  appointmentId,
  stylistId,
  stylistName,
  serviceDuration,
  currentDate,
  onRescheduled,
}: RescheduleDialogProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const handleSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }

    setRescheduling(true);
    try {
      const newDateTime = `${selectedDate}T${selectedTime}:00`;

      const { error } = await supabase
        .from("appointments")
        .update({ appointment_date: newDateTime })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment rescheduled",
        description: `Your appointment has been moved to ${new Date(newDateTime).toLocaleDateString()} at ${selectedTime}`,
      });
      onRescheduled();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to reschedule",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  const handleClose = () => {
    setSelectedDate("");
    setSelectedTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule with {stylistName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current appointment:{" "}
            <strong>
              {new Date(currentDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(currentDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>

          <TimeSlotPicker
            stylistId={stylistId}
            serviceDuration={serviceDuration}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={rescheduling}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleReschedule}
              disabled={rescheduling || !selectedDate || !selectedTime}
            >
              {rescheduling ? "Rescheduling..." : "Confirm New Time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
