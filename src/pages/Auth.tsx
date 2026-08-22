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
import mirraLogo from "@/assets/mirra-mark.png";

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
      toast({ title: "Account created!", description: "Welcome to Mirra" });
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
          <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center">
            <Scissors className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-radial flex flex-col items-center justify-center min-h-screen px-5 py-10 safe-area-top safe-area-bottom relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Brand Header */}
      <div className="w-full max-w-md mb-10 animate-fade-in">
        <img
          src={mirraLogo}
          alt="Mirra logo"
          className="w-16 h-16 mb-6 object-contain"
        />
        <p className="eyebrow text-muted-foreground mb-3">{t("auth.customer")} &middot; {t("auth.stylist")}</p>
        <h1 className="font-display text-5xl leading-[1.05] text-foreground">
          Mirra
        </h1>
        <p className="text-muted-foreground mt-4 text-base max-w-sm leading-relaxed">
          {t("auth.signInOrCreate")}
        </p>
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Role Toggle */}
        <div className="flex border-y border-border">
          <button
            onClick={() => setIsStylist(false)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 min-h-[52px] text-sm transition-colors no-tap-highlight ${
              !isStylist
                ? 'text-foreground border-b-2 border-primary -mb-px font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            {t("auth.customer")}
          </button>
          <button
            onClick={() => setIsStylist(true)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 min-h-[52px] text-sm transition-colors no-tap-highlight ${
              isStylist
                ? 'text-foreground border-b-2 border-accent -mb-px font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scissors className="w-4 h-4" />
            {t("auth.stylist")}
          </button>
        </div>

        {/* Google Login */}
        <Button
          variant="outline"
          className="w-full gap-2 h-13 min-h-[52px] rounded-md border-border bg-transparent hover:bg-muted/60 text-foreground font-medium no-tap-highlight transition-colors"
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
          <div className="relative flex justify-center">
            <span className="bg-background px-4 eyebrow text-muted-foreground">{t("auth.orContinueWithEmail")}</span>
          </div>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent h-11 p-0 gap-6 justify-start rounded-none border-b border-border">
            <TabsTrigger
              value="signin"
              className="h-11 rounded-none bg-transparent px-0 eyebrow text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {t("auth.signIn")}
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="h-11 rounded-none bg-transparent px-0 eyebrow text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {t("auth.signUp")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-5 mt-7">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="eyebrow text-muted-foreground">{t("common.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder={t("auth.emailPlaceholder")}
                  className="pl-10 h-13 min-h-[52px] border border-border bg-card focus:border-primary text-base text-foreground rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="eyebrow text-muted-foreground">{t("common.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pl-10 h-13 min-h-[52px] border border-border bg-card focus:border-primary text-base text-foreground rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full h-13 min-h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base active:scale-[0.99] transition-all rounded-md"
              onClick={handleSignIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
            <div className="text-center">
              <Link
                to="/reset-password"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 p-2 inline-flex items-center justify-center min-h-[44px]"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-5 mt-7">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="eyebrow text-muted-foreground">{t("common.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder={t("auth.emailPlaceholder")}
                  className="pl-10 h-13 min-h-[52px] border border-border bg-card focus:border-primary text-base rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="eyebrow text-muted-foreground">{t("common.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pl-10 h-13 min-h-[52px] border border-border bg-card focus:border-primary text-base rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className={`w-full h-13 min-h-[52px] font-medium text-base active:scale-[0.99] transition-all rounded-md ${
                isStylist
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              onClick={handleSignUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("auth.creatingAccount") : t("auth.signUpAs", { role: isStylist ? t("auth.stylist") : t("auth.customer") })}
            </Button>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("auth.termsAgreement")}
        </p>
      </div>
    </div>
  );
};

export default Auth;