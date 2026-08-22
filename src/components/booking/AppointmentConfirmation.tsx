import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { StylistLocationLink } from "@/components/map/StylistLocationLink";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface AppointmentConfirmationProps {
  appointmentId: string;
  appointmentDate: string;
  stylistName: string;
  stylistAddress?: string;
  stylistLatitude?: number;
  stylistLongitude?: number;
  onConfirm: () => void;
}

export const AppointmentConfirmation = ({
  appointmentId,
  appointmentDate,
  stylistName,
  stylistAddress,
  stylistLatitude,
  stylistLongitude,
  onConfirm,
}: AppointmentConfirmationProps) => {
  const { t } = useTranslation();
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
      toast({ title: t("appointmentConfirmation.attendanceConfirmed") });
      onConfirm();
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
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
      confirmed ? "border-success bg-green-50" : "border-primary"
    )}>
      <CardContent className="p-6 text-center space-y-4">
        {confirmed ? (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700">{t("appointmentConfirmation.seeYouSoon")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("appointmentConfirmation.stylistReady", { stylist: stylistName })}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("appointmentConfirmation.confirmTitle")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("appointmentConfirmation.appointmentIn", { stylist: stylistName, hours: hoursUntil })}
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
              {(stylistAddress || stylistLatitude) && (
                <StylistLocationLink
                  address={stylistAddress}
                  latitude={stylistLatitude}
                  longitude={stylistLongitude}
                  stylistName={stylistName}
                  variant="inline"
                  className="text-sm"
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  toast({ title: t("appointmentConfirmation.rescheduleComingSoon") });
                }}
              >
                {t("customer.appointments.reschedule")}
              </Button>
              <Button
                onClick={confirmAttendance}
                disabled={confirming}
                className="flex-1 bg-gradient-to-r from-accent to-primary"
              >
                {confirming ? t("appointmentConfirmation.confirming") : t("customer.appointments.confirmAttendance")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
