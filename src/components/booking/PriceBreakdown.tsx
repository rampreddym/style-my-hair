import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Info, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PriceBreakdownProps {
  service: {
    name: string;
    price: number;
    duration_minutes: number;
  };
  tip?: number;
  platformFeePercent?: number;
}

export const PriceBreakdown = ({ 
  service, 
  tip = 0, 
  platformFeePercent = 0 
}: PriceBreakdownProps) => {
  const subtotal = service.price + tip;
  const platformFee = subtotal * (platformFeePercent / 100);
  const total = subtotal + platformFee;

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-foreground">{service.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({service.duration_minutes} min)
            </span>
          </div>
          <span className="font-medium">${service.price.toFixed(2)}</span>
        </div>

        {/* Tip (if applicable) */}
        {tip > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Tip</span>
            <span>${tip.toFixed(2)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-muted-foreground">Subtotal</span>
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
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Secure payment · Free cancellation up to 24h before</span>
        </div>

        {/* Refund policy */}
        <p className="text-xs text-muted-foreground">
          By confirming, you agree to our{" "}
          <button className="text-primary underline">cancellation policy</button>.
          Full refund available if cancelled 24+ hours before appointment.
        </p>
      </CardContent>
    </Card>
  );
};
