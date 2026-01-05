import { useState } from "react";
import { format } from "date-fns";
import { Bell, Clock, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylistId: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  onSuccess?: () => void;
}

export function WaitlistDialog({
  open,
  onOpenChange,
  stylistId,
  serviceId,
  serviceName,
  customerId,
  onSuccess,
}: WaitlistDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [preferredTimeStart, setPreferredTimeStart] = useState<string>("");
  const [preferredTimeEnd, setPreferredTimeEnd] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleJoinWaitlist = async () => {
    if (!selectedDate) {
      toast.error("Please select a preferred date");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        customer_id: customerId,
        stylist_id: stylistId,
        service_id: serviceId,
        preferred_date: format(selectedDate, "yyyy-MM-dd"),
        preferred_time_start: preferredTimeStart || null,
        preferred_time_end: preferredTimeEnd || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Added to waitlist! We'll notify you when a slot opens up.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast.error("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Join Waitlist
          </DialogTitle>
          <DialogDescription>
            Get notified when an earlier slot opens up for {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Preferred Date
            </Label>
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Preferred Time Range (Optional)
            </Label>
            <div className="flex gap-2">
              <Select value={preferredTimeStart} onValueChange={setPreferredTimeStart}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={preferredTimeEnd} onValueChange={setPreferredTimeEnd}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You'll receive a push notification when a matching slot becomes available.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinWaitlist}
            disabled={!selectedDate || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
