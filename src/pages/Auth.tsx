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
import { Scissors, User, Mail, Lock, Chrome } from "lucide-react";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { z } from "zod";

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
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
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
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Welcome back!", description: "Redirecting..." });
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle(role);
    if (error) {
      toast({ title: "Google login failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="page-gradient flex items-center justify-center safe-area-top">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-radial flex items-center justify-center p-4 safe-area-top safe-area-bottom relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card variant="elevated" className="w-full max-w-md shadow-elevated border-0 card-shine">
        <CardHeader className="text-center space-y-4 pb-2">
          <CardTitle className="text-2xl font-bold uppercase tracking-wide">{t("auth.welcome")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("auth.signInOrCreate")}
          </CardDescription>
          
          {/* Role Toggle - Pill Buttons with proper touch targets */}
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-sm font-medium text-primary">
              {isStylist ? t("auth.stylist") : t("auth.customer")}
            </span>
            <div className="flex bg-muted rounded-full p-1">
              <button
                onClick={() => setIsStylist(false)}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-all no-tap-highlight active:scale-95 ${
                  !isStylist 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                {t("auth.customer")}
              </button>
              <button
                onClick={() => setIsStylist(true)}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-all no-tap-highlight active:scale-95 ${
                  isStylist 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {t("auth.stylist")}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Login */}
          <Button 
            variant="outline" 
            className="w-full gap-2 h-14 border-2 hover:bg-muted/50 no-tap-highlight active:scale-[0.98]" 
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <Chrome className="w-5 h-5" />
            {t("auth.continueWithGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground">{t("auth.orContinueWithEmail")}</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-12">
              <TabsTrigger 
                value="signin" 
                className="min-h-[40px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("auth.signIn")}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="min-h-[40px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("auth.signUp")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="font-medium">{t("common.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-14 border-2 focus:border-primary text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="font-medium">{t("common.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    className="pl-10 h-14 border-2 focus:border-primary text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base active:scale-[0.98]" 
                onClick={handleSignIn}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
              <div className="text-center py-2">
                <Link 
                  to="/reset-password" 
                  className="text-sm text-primary hover:underline font-medium p-2 inline-block min-h-[44px] flex items-center justify-center"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-medium">{t("common.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-14 border-2 focus:border-primary text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-medium">{t("common.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    className="pl-10 h-14 border-2 focus:border-primary text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base active:scale-[0.98]" 
                onClick={handleSignUp}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.creatingAccount") : t("auth.signUpAs", { role: isStylist ? t("auth.stylist") : t("auth.customer") })}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground pb-2">
            {t("auth.termsAgreement")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
