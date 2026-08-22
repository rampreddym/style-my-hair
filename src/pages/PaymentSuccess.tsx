import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");

  useEffect(() => {
    // Mark payment as paid
    if (appointmentId) {
      supabase
        .from("appointments")
        .update({ payment_status: "paid" })
        .eq("id", appointmentId)
        .then(({ error }) => {
          if (error) console.error("Failed to update payment status:", error);
        });
    }
  }, [appointmentId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">
              Your appointment has been confirmed and payment processed.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/customer/appointments")}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View My Appointments
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/customer/booking")}
              className="w-full"
            >
              Book Another Service
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
