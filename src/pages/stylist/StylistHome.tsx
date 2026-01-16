import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Scissors, Calendar, CheckCircle } from "lucide-react";
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
        // Check stylist profile
        const { data: stylist } = await supabase
          .from("stylists")
          .select("id, onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (stylist?.onboarding_completed) {
          setOnboardingComplete(true);

          // Check if they have services
          const { data: services } = await supabase
            .from("stylist_services")
            .select("id")
            .eq("stylist_id", stylist.id)
            .limit(1);

          if (services && services.length > 0) {
            setHasServices(true);
            // Redirect to appointments
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

    if (user) {
      checkStatus();
    }
  }, [user, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  // Show prompt to complete setup
  return (
    <div className="min-h-screen bg-background p-4 safe-area-top relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-lg mx-auto pt-8 space-y-6">
        <div className="text-center space-y-2">
          <Scissors className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("stylist.home.welcome")}</h1>
          <p className="text-muted-foreground">
            {t("stylist.home.setupMessage")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Onboarding Card */}
          <Card className={onboardingComplete ? "border-green-500/50 bg-green-500/5" : "border-primary/50"}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {onboardingComplete ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                    1
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{t("stylist.home.completeProfile")}</CardTitle>
                  <CardDescription>
                    {onboardingComplete 
                      ? t("stylist.home.completed")
                      : t("stylist.home.profileDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {!onboardingComplete && (
              <CardContent className="pt-0">
                <Button 
                  onClick={() => navigate("/stylist/onboarding")} 
                  className="w-full"
                >
                  {t("stylist.home.getStarted")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Services Card */}
          <Card className={hasServices ? "border-green-500/50 bg-green-500/5" : onboardingComplete ? "border-primary/50" : "opacity-50"}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {hasServices ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center text-sm font-bold text-muted-foreground">
                    2
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{t("stylist.home.addServices")}</CardTitle>
                  <CardDescription>
                    {hasServices 
                      ? t("stylist.home.completed")
                      : t("stylist.home.servicesDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {onboardingComplete && !hasServices && (
              <CardContent className="pt-0">
                <Button 
                  onClick={() => navigate("/stylist/services")} 
                  className="w-full"
                >
                  {t("stylist.services.addService")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Appointments Card */}
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{t("stylist.home.receiveBookings")}</CardTitle>
                  <CardDescription>
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
