import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Scissors, User, Mail, Lock, Chrome, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { z } from "zod";
import { getUserFriendlyError } from '@/lib/errorHandler';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, userRole, signUp, signIn, signInWithGoogle, loading } = useAuth();
  
  const [isStylist, setIsStylist] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authSchema = z.object({
    email: z.string().trim().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMinLength"))
  });

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate(userRole === 'stylist' ? '/stylist' : '/customer');
    }
  }, [user, userRole, loading, navigate]);

  const role = isStylist ? 'stylist' : 'customer';

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(", ");
      toast({ title: "Validation Error", description: errors, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const { error } = await signUp(email, password, role);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes("already registered")) {
        toast({ title: "Account exists", description: "This email is already registered. Please sign in instead.", variant: "destructive" });
      } else {
        toast({ title: "Sign up failed", description: getUserFriendlyError(error), variant: "destructive" });
      }
    } else {
      toast({ title: "Account created!", description: "Welcome to StyleMatch" });
      navigate(role === 'stylist' ? '/stylist' : '/customer');
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setIsSubmitting(false);
      if (error.message.includes("Invalid login")) {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
      } else {
        toast({ title: "Login failed", description: getUserFriendlyError(error), variant: "destructive" });
      }
    } else {
      toast({ title: "Welcome back!", description: "Redirecting..." });
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle(role);
    if (error) {
      toast({ title: "Google login failed", description: getUserFriendlyError(error), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="page-radial flex items-center justify-center min-h-screen safe-area-top">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-radial flex flex-col items-center justify-center min-h-screen p-4 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-32 right-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      {/* Brand Header */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <Scissors className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-gradient-primary">Style</span>
          <span className="text-foreground">Match</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
          {t("auth.signInOrCreate")}
        </p>
      </div>

      <Card variant="glow" className="w-full max-w-md shadow-elevated border border-primary/20 animate-fade-in">
        <CardContent className="p-6 space-y-5">
          {/* Role Toggle */}
          <div className="flex items-center justify-center">
            <div className="flex bg-secondary/80 rounded-2xl p-1 border border-border/50 w-full max-w-xs">
              <button
                onClick={() => setIsStylist(false)}
                className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-all no-tap-highlight active:scale-95 ${
                  !isStylist 
                    ? 'bg-gradient-primary text-primary-foreground shadow-glow-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                {t("auth.customer")}
              </button>
              <button
                onClick={() => setIsStylist(true)}
                className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-all no-tap-highlight active:scale-95 ${
                  isStylist 
                    ? 'bg-gradient-primary text-primary-foreground shadow-glow-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {t("auth.stylist")}
              </button>
            </div>
          </div>

          {/* Google Login */}
          <Button 
            variant="outline" 
            className="w-full gap-2 h-14 border-2 border-accent/30 bg-accent/5 hover:bg-accent/15 text-accent font-semibold no-tap-highlight active:scale-[0.98] transition-all" 
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <Chrome className="w-5 h-5" />
            {t("auth.continueWithGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground">{t("auth.orContinueWithEmail")}</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/60 h-12 border border-border/30 rounded-xl">
              <TabsTrigger 
                value="signin" 
                className="min-h-[40px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary font-semibold"
              >
                {t("auth.signIn")}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="min-h-[40px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary font-semibold"
              >
                {t("auth.signUp")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="font-medium text-foreground text-sm">{t("common.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-primary/60" />
                  <Input
                    id="signin-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-14 border-2 border-border/50 bg-secondary/40 focus:border-primary focus:bg-secondary/60 text-base text-foreground rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="font-medium text-foreground text-sm">{t("common.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-accent/60" />
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    className="pl-10 h-14 border-2 border-border/50 bg-secondary/40 focus:border-primary focus:bg-secondary/60 text-base text-foreground rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-base active:scale-[0.98] shadow-glow-primary transition-all rounded-xl" 
                onClick={handleSignIn}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
              <div className="text-center">
                <Link 
                  to="/reset-password" 
                  className="text-sm text-primary hover:text-primary/80 hover:underline font-medium p-2 inline-flex items-center justify-center min-h-[44px]"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-medium text-sm">{t("common.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-primary/60" />
                  <Input
                    id="signup-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-14 border-2 border-border/50 bg-secondary/40 focus:border-primary text-base rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-medium text-sm">{t("common.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-accent/60" />
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    className="pl-10 h-14 border-2 border-border/50 bg-secondary/40 focus:border-primary text-base rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-base active:scale-[0.98] shadow-glow-primary transition-all rounded-xl" 
                onClick={handleSignUp}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.creatingAccount") : t("auth.signUpAs", { role: isStylist ? t("auth.stylist") : t("auth.customer") })}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground pb-1">
            {t("auth.termsAgreement")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;