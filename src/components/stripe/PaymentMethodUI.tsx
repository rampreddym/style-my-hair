import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock, Check, X } from "lucide-react";

interface PaymentMethodUIProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const PaymentMethodUI = ({ onClose, onSuccess }: PaymentMethodUIProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    if (!formData.cardNumber || !formData.expiry || !formData.cvc || !formData.name) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    
    // Simulate saving payment method
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setSaved(true);
    setSaving(false);
    
    toast({ title: "Payment method saved!", description: "Your card has been securely saved" });
    
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1000);
  };

  if (saved) {
    return (
      <Card className="mt-4 border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <p className="font-medium text-green-600">Payment method saved!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Card
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Cardholder Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label>Card Number</Label>
          <div className="relative">
            <Input
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-5" />
              <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Expiry</Label>
            <Input
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label>CVC</Label>
            <Input
              value={formData.cvc}
              onChange={(e) => setFormData({ ...formData, cvc: e.target.value.replace(/\D/g, "").substring(0, 4) })}
              placeholder="123"
              maxLength={4}
              type="password"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          Your payment info is encrypted and secure
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Card"}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <svg className="h-5" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
            <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a12.6 12.6 0 0 1-4.56.83c-4.14 0-6.94-2.54-6.94-7.08 0-4.53 2.74-7.34 6.42-7.34 3.63 0 5.95 2.8 5.95 6.86 0 .65-.06 1.36-.06 1.81zm-5.76-5.2c-1.18 0-2.05.86-2.22 2.53h4.26c-.06-1.67-.9-2.53-2.04-2.53zM41.47 5.88h4.4V19.5h-4.4V5.88zm0-5.38h4.4v3.85h-4.4V.5zM35.17 9.88c-.8-.62-1.9-.99-3.28-.99-1.67 0-2.55.55-2.55 1.36 0 .93 1.05 1.24 2.41 1.49l1.12.19c3.14.56 4.94 1.98 4.94 4.57 0 3.2-2.54 4.94-6.36 4.94-2.29 0-4.33-.56-5.82-1.73l1.67-2.78c1.12.93 2.66 1.49 4.2 1.49 1.55 0 2.53-.56 2.53-1.49 0-.87-.93-1.24-2.53-1.55l-1.12-.19c-2.9-.5-4.82-1.86-4.82-4.45 0-3.08 2.47-5.01 6.23-5.01 2.16 0 4.14.56 5.45 1.49l-2.07 2.66zM20.44 14.28c-.93 3.08-3.45 4.94-6.6 4.94-4.27 0-7.09-3.14-7.09-7.21s2.82-7.21 7.09-7.21c3.08 0 5.7 1.86 6.6 4.94h-4.64c-.5-.93-1.24-1.43-2.09-1.43-1.55 0-2.59 1.43-2.59 3.7s1.05 3.7 2.59 3.7c.87 0 1.61-.5 2.09-1.43h4.64z"/>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodUI;