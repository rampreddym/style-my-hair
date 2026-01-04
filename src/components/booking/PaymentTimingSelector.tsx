import { CreditCard, Clock, Shield, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type PaymentTiming = "pay_now" | "pay_later";

interface PaymentTimingSelectorProps {
  value: PaymentTiming;
  onChange: (timing: PaymentTiming) => void;
  servicePrice: number;
}

export const PaymentTimingSelector = ({
  value,
  onChange,
  servicePrice,
}: PaymentTimingSelectorProps) => {
  const options = [
    {
      id: "pay_now" as PaymentTiming,
      title: "Pay Now",
      subtitle: "Secure your spot",
      icon: CreditCard,
      benefits: [
        "Guaranteed appointment",
        "No payment at salon",
        "Easy refunds if cancelled 24h+"
      ],
      badge: "Recommended",
      badgeColor: "bg-primary text-primary-foreground",
    },
    {
      id: "pay_later" as PaymentTiming,
      title: "Pay After Service",
      subtitle: "Pay at the salon",
      icon: Clock,
      benefits: [
        "Pay when satisfied",
        "Cash or card accepted",
        "Tip in person"
      ],
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          When would you like to pay?
        </h3>
        
        <div className="grid gap-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.id;
            
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                {/* Badge */}
                {option.badge && (
                  <span className={`absolute -top-2 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                )}

                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-foreground">{option.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{option.subtitle}</p>
                    
                    {/* Benefits */}
                    <ul className="mt-2 space-y-1">
                      {option.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className={`w-3 h-3 ${isSelected ? "text-primary" : "text-muted-foreground/60"}`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price indicator */}
                  <div className="text-right">
                    <span className="font-bold text-lg text-foreground">${servicePrice.toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground">
                      {option.id === "pay_now" ? "charged now" : "pay at salon"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info text based on selection */}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          {value === "pay_now" ? (
            <>
              <Shield className="w-3 h-3 inline mr-1 text-primary" />
              Your payment is protected. Full refund if cancelled 24+ hours before appointment.
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 inline mr-1 text-muted-foreground" />
              A hold may be placed on your card. Payment collected at the salon after service.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
};
