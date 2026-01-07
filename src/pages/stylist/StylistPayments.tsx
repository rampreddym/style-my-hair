import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ExternalLink, Check, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { StylistLayout } from "@/components/layout/StylistLayout";

const StylistPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stylist, setStylist] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  const stylistId = sessionStorage.getItem("stylistId");

  useEffect(() => {
    if (!stylistId) {
      navigate("/stylist");
      return;
    }
    fetchStylist();
  }, [stylistId]);

  const fetchStylist = async () => {
    const { data } = await supabase
      .from("stylists")
      .select("*")
      .eq("id", stylistId)
      .single();

    if (data) setStylist(data);
    setLoading(false);
  };

  const connectStripe = async () => {
    setConnecting(true);
    
    toast({
      title: t("stylistPayments.stripeConnect"),
      description: t("stylistPayments.stripeConnectDesc"),
    });

    setTimeout(async () => {
      await supabase
        .from("stylists")
        .update({
          stripe_account_id: "acct_demo_" + Date.now(),
          stripe_onboarded: true,
        })
        .eq("id", stylistId);

      setStylist({ ...stylist, stripe_onboarded: true });
      setConnecting(false);
      toast({ title: t("stylistPayments.setupComplete") });
    }, 2000);
  };

  if (loading) {
    return (
      <StylistLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
        </div>
      </StylistLayout>
    );
  }

  return (
    <StylistLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t("stylist.payments.stripeSetup")}</h1>
            <p className="text-sm text-muted-foreground">{t("stylistPayments.configurePayments")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5" />
                {t("stylistPayments.stripeConnect")}
              </CardTitle>
              <CardDescription>
                {t("stylistPayments.securePayments")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stylist?.stripe_onboarded ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Check className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-500">Connected to Stripe</p>
                    <p className="text-sm text-muted-foreground">
                      You're all set to receive payments from clients
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-600">Payment setup required</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your Stripe account to start receiving payments from clients
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={connectStripe}
                    disabled={connecting}
                    className="w-full h-14 bg-[#635BFF] hover:bg-[#5851DB]"
                  >
                    {connecting ? (
                      "Connecting..."
                    ) : (
                      <>
                        Connect with Stripe
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">{t("stylistPayments.howItWorks")}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                    {t("stylistPayments.step1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                    {t("stylistPayments.step2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                    {t("stylistPayments.step3")}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                {t("stylistPayments.earningsOverview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">$0</p>
                  <p className="text-xs text-muted-foreground">{t("stylistPayments.thisWeek")}</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">$0</p>
                  <p className="text-xs text-muted-foreground">{t("stylist.payments.thisMonth")}</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">$0</p>
                  <p className="text-xs text-muted-foreground">{t("stylistPayments.allTime")}</p>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t("stylistPayments.earningsDataAppear")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("stylistPayments.pricingFees")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("stylist.payments.platformFee")}</span>
                <span>{t("stylistPayments.platformFeeValue")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("stylist.payments.payoutSchedule")}</span>
                <span>{t("stylistPayments.payoutScheduleValue")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("stylistPayments.minimumPayout")}</span>
                <span>$1.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StylistLayout>
  );
};

export default StylistPayments;
