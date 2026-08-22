import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Scissors, Calendar, CheckCircle, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";

const StylistHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [hasServices, setHasServices] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && userRole && userRole !== "stylist") {
      navigate("/customer");
      return;
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const { data: stylist } = await supabase
          .from("stylists")
          .select("id, onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (stylist?.onboarding_completed) {
          setOnboardingComplete(true);
          const { data: services } = await supabase
            .from("stylist_services")
            .select("id")
            .eq("stylist_id", stylist.id)
            .limit(1);

          if (services && services.length > 0) {
            setHasServices(true);
            navigate("/stylist/appointments", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Error checking stylist status:", error);
      } finally {
        setChecking(false);
      }
    };

    if (user) checkStatus();
  }, [user, navigate]);

  if (authLoading || checking) {
    return (
      <div className="page-radial flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <Scissors className="w-8 h-8 text-accent-foreground" />
          </div>
          <div className="text-muted-foreground animate-pulse">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-radial min-h-screen p-4 safe-area-top relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl animate-float" />
      <div className="absolute bottom-40 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-lg mx-auto pt-8 space-y-8 relative z-10">
        {/* Brand Hero */}
        <div className="text-center space-y-4 animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-accent flex items-center justify-center">
            <Scissors className="w-10 h-10 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{t("stylist.home.welcome")}</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              {t("stylist.home.setupMessage")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1: Onboarding */}
          <Card className={`transition-all animate-fade-in ${onboardingComplete ? "border-success/30 bg-success/5" : "border-primary/30"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {onboardingComplete ? (
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    1
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">{t("stylist.home.completeProfile")}</CardTitle>
                  <CardDescription className="text-sm">
                    {onboardingComplete ? t("stylist.home.completed") : t("stylist.home.profileDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {!onboardingComplete && (
              <CardContent className="pt-0">
                <Button 
                  onClick={() => navigate("/stylist/onboarding")} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {t("stylist.home.getStarted")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Step 2: Services */}
          <Card className={`transition-all animate-fade-in ${hasServices ? "border-success/30 bg-success/5" : onboardingComplete ? "border-accent/30" : "opacity-40"}`} style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {hasServices ? (
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    2
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">{t("stylist.home.addServices")}</CardTitle>
                  <CardDescription className="text-sm">
                    {hasServices ? t("stylist.home.completed") : t("stylist.home.servicesDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {onboardingComplete && !hasServices && (
              <CardContent className="pt-0">
                <Button 
                  onClick={() => navigate("/stylist/services")} 
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  {t("stylist.services.addService")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Step 3: Bookings */}
          <Card className="opacity-40 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{t("stylist.home.receiveBookings")}</CardTitle>
                  <CardDescription className="text-sm">
                    {t("stylist.home.bookingsDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StylistHome;