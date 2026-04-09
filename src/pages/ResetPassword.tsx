import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { z } from "zod";
import { getUserFriendlyError } from '@/lib/errorHandler';

const ResetPassword = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const emailSchema = z.string().trim().email(t("auth.invalidEmail"));

  const handleResetPassword = async () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({ title: t("auth.validationError"), description: result.error.errors[0].message, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: t("common.error"), description: getUserFriendlyError(error), variant: "destructive" });
    } else {
      setIsEmailSent(true);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("resetPassword.checkEmail")}</CardTitle>
            <CardDescription>
              {t("resetPassword.emailSent")} <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("resetPassword.checkSpam", "Click the link in the email to reset your password. If you don't see it, check your spam folder.")}
            </p>
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("resetPassword.backToSignIn")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
          <CardDescription>
            {t("resetPassword.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t("common.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleResetPassword}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("resetPassword.sending") : t("resetPassword.sendLink")}
          </Button>

          <Link to="/" className="block">
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("resetPassword.backToSignIn")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
