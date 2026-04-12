import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StripePaymentFormProps {
  appointmentId: string;
  amount: number;
  tip: number;
  serviceName: string;
  stylistName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Inner form that uses Stripe hooks
const CheckoutForm = ({
  onSuccess,
  onCancel,
  amount,
  tip,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  tip: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      });
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      setSucceeded(true);
      toast({ title: "Payment successful!" });
      setTimeout(() => onSuccess(), 1500);
    } else {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <p className="font-semibold text-foreground">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Your payment info is encrypted and secure via Stripe
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-gradient-to-r from-primary to-accent"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(amount + tip).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
};

// Outer wrapper that sets up Stripe Elements
const StripePaymentForm = ({
  appointmentId,
  amount,
  tip,
  serviceName,
  stylistName,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch publishable key
        const { data: keyData, error: keyError } = await supabase.functions.invoke("get-stripe-key");
        if (keyError || !keyData?.publishableKey) {
          throw new Error("Failed to load payment configuration");
        }
        setStripePromise(loadStripe(keyData.publishableKey));

        // Create payment intent
        const { data: piData, error: piError } = await supabase.functions.invoke("create-payment-intent", {
          body: { appointmentId, amount, tip, serviceName, stylistName },
        });
        if (piError || !piData?.clientSecret) {
          throw new Error(piData?.error || "Failed to initialize payment");
        }
        setClientSecret(piData.clientSecret);
      } catch (err: any) {
        const msg = err?.message || "Payment initialization failed";
        setError(msg);
        toast({ title: "Payment error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [appointmentId, amount, tip, serviceName, stylistName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Setting up secure payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={onCancel}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  if (!stripePromise || !clientSecret) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Enter Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#e040a0",
                colorBackground: "#1a1a2e",
                colorText: "#e0e0e0",
                colorDanger: "#ef4444",
                fontFamily: "system-ui, sans-serif",
                borderRadius: "12px",
              },
            },
          }}
        >
          <CheckoutForm
            onSuccess={onSuccess}
            onCancel={onCancel}
            amount={amount}
            tip={tip}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;
