import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, ExternalLink, Shield } from "lucide-react";

interface PayoutStepProps {
  stripeOnboarded: boolean;
  onConnectStripe: () => void;
}

export const PayoutStep = ({ stripeOnboarded, onConnectStripe }: PayoutStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent" />
            Payment Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            {stripeOnboarded ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Payments Connected!</h3>
                  <p className="text-muted-foreground">
                    You're all set to receive payments from clients.
                  </p>
                </div>
                <Badge variant="secondary" className="text-green-600 bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Connect Your Bank Account</h3>
                  <p className="text-muted-foreground">
                    Set up payments to receive money directly to your bank account.
                  </p>
                </div>
                <Button onClick={onConnectStripe} className="bg-gradient-to-r from-accent to-primary">
                  Connect with Stripe
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Security info */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Secure & Protected</p>
              <p className="text-muted-foreground">
                We use Stripe, the same payment processor trusted by millions of businesses.
                Your banking information is never stored on our servers.
              </p>
            </div>
          </div>

          {/* Fee structure */}
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">How it works</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client pays</span>
                <span className="text-foreground">$50.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform fee (15%)</span>
                <span>-$7.50</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment processing (2.9% + $0.30)</span>
                <span>-$1.75</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-medium">
                <span className="text-foreground">You receive</span>
                <span className="text-primary">$40.75</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
