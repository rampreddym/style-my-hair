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
import { Lock, CreditCard, CheckCircle, Loader2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface StripePaymentFormProps {
  appointmentId: string;
  amount: number;
  tip: number;
  serviceName: string;
  stylistName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const brandIcons: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Mastercard",
  amex: "💳 Amex",
  discover: "💳 Discover",
  unknown: "💳",
};

// Saved card selection + one-tap pay
const SavedCardSelector = ({
  cards,
  appointmentId,
  amount,
  tip,
  serviceName,
  stylistName,
  onSuccess,
  onUseNewCard,
}: {
  cards: SavedCard[];
  appointmentId: string;
  amount: number;
  tip: number;
  serviceName: string;
  stylistName: string;
  onSuccess: () => void;
  onUseNewCard: () => void;
}) => {
  const [selectedCard, setSelectedCard] = useState<string>(cards[0]?.id || "");
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const { toast } = useToast();

  const handlePayWithSaved = async () => {
    if (!selectedCard) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("pay-with-saved-card", {
        body: {
          appointmentId,
          amount,
          tip,
          serviceName,
          stylistName,
          paymentMethodId: selectedCard,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Payment failed");
      }

      setSucceeded(true);
      toast({ title: "Payment successful!" });
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message || "Could not charge saved card. Try a new card.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <p className="font-semibold text-foreground">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelectedCard(card.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              selectedCard === card.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="text-lg">{brandIcons[card.brand] || brandIcons.unknown}</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground capitalize">
                {card.brand} •••• {card.last4}
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedCard === card.id ? "border-primary" : "border-muted"
              }`}
            >
              {selectedCard === card.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        onClick={onUseNewCard}
        className="w-full text-sm text-muted-foreground"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Use a new card instead
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Your payment info is encrypted and secure via Stripe
      </div>

      <Button
        onClick={handlePayWithSaved}
        disabled={!selectedCard || processing}
        className="w-full bg-gradient-to-r from-primary to-accent"
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
  );
};

// Inner form that uses Stripe hooks (new card)
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
        <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <p className="font-semibold text-foreground">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Your card will be saved for faster future payments
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

// Outer wrapper
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
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch saved cards and publishable key in parallel
        const [keyRes, cardsRes] = await Promise.all([
          supabase.functions.invoke("get-stripe-key"),
          supabase.functions.invoke("list-payment-methods"),
        ]);

        if (keyRes.error || !keyRes.data?.publishableKey) {
          throw new Error("Failed to load payment configuration");
        }
        setStripePromise(loadStripe(keyRes.data.publishableKey));

        // Set saved cards
        if (!cardsRes.error && cardsRes.data?.paymentMethods?.length > 0) {
          setSavedCards(cardsRes.data.paymentMethods);
          setUseSavedCard(true);
        } else {
          setUseSavedCard(false);
        }

        // Create payment intent (needed for new card flow)
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

  // Show saved cards
  if (useSavedCard && savedCards.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your Saved Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SavedCardSelector
            cards={savedCards}
            appointmentId={appointmentId}
            amount={amount}
            tip={tip}
            serviceName={serviceName}
            stylistName={stylistName}
            onSuccess={onSuccess}
            onUseNewCard={() => setUseSavedCard(false)}
          />
        </CardContent>
      </Card>
    );
  }

  if (!stripePromise || !clientSecret) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Enter Payment Details
          </CardTitle>
          {savedCards.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseSavedCard(true)}
              className="text-xs text-primary"
            >
              <Wallet className="w-3 h-3 mr-1" />
              Use saved card
            </Button>
          )}
        </div>
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
