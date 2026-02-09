import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Info, Shield, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaymentTiming } from "./PaymentTimingSelector";

interface Service {
  id?: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface PriceBreakdownProps {
  service?: Service;
  services?: Service[];
  tip?: number;
  platformFeePercent?: number;
  paymentTiming?: PaymentTiming;
}

export const PriceBreakdown = ({ 
  service, 
  services,
  tip = 0, 
  platformFeePercent = 0,
  paymentTiming = "pay_now"
}: PriceBreakdownProps) => {
  // Support both single service and multiple services
  const serviceList = services || (service ? [service] : []);
  const serviceTotal = serviceList.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = serviceList.reduce((sum, s) => sum + s.duration_minutes, 0);
  
  const subtotal = serviceTotal + tip;
  const platformFee = subtotal * (platformFeePercent / 100);
  const total = subtotal + platformFee;

  // Group services by name for display
  const groupedServices = serviceList.reduce((acc, s) => {
    const key = s.name;
    if (!acc[key]) {
      acc[key] = { ...s, count: 1 };
    } else {
      acc[key].count++;
    }
    return acc;
  }, {} as Record<string, Service & { count: number }>);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Services */}
        {Object.values(groupedServices).map((s, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <span className="text-foreground">
                {s.name}
                {s.count > 1 && <span className="text-muted-foreground ml-1">×{s.count}</span>}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({s.duration_minutes * s.count} min)
              </span>
            </div>
            <span className="font-medium">${(s.price * s.count).toFixed(2)}</span>
          </div>
        ))}

        {/* Tip (if applicable) */}
        {tip > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Tip</span>
            <span>${tip.toFixed(2)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div>
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-xs text-muted-foreground ml-2">({totalDuration} min total)</span>
          </div>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {/* Platform Fee */}
        {platformFeePercent > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Platform fee ({platformFeePercent}%)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      This fee covers secure payment processing, customer support, and platform maintenance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span>${platformFee.toFixed(2)}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t-2 border-border font-semibold text-lg">
          <span>Total</span>
          <div className="text-right">
            <span className="text-primary">${total.toFixed(2)}</span>
            {paymentTiming === "pay_later" && (
              <p className="text-xs font-normal text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                Due at salon
              </p>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>
            {paymentTiming === "pay_now" 
              ? "Secure payment · Full refund if cancelled 24h+ before" 
              : "No charge now · Pay after your service"}
          </span>
        </div>

        {/* Refund policy */}
        <p className="text-xs text-muted-foreground">
          By confirming, you agree to our{" "}
          <button className="text-primary underline">cancellation policy</button>.
          {paymentTiming === "pay_now" 
            ? " Full refund available if cancelled 24+ hours before appointment."
            : " Cancellation fee may apply for no-shows."}
        </p>
      </CardContent>
    </Card>
  );
};
