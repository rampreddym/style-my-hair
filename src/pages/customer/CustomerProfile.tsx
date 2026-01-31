import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, CreditCard, MapPin, LogOut, ChevronLeft, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import PaymentMethodUI from "@/components/stripe/PaymentMethodUI";
import { GuidedPhotoCapture } from "@/components/customer/GuidedPhotoCapture";
import { HairStyleSelector } from "@/components/customer/HairStyleSelector";
import { NotificationToggle } from "@/components/notifications/NotificationToggle";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [hairStyles, setHairStyles] = useState<any[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    name: "",
    gender: "",
    age: "",
    preferred_style_description: "",
    preferred_style_category: "",
    share_ai_styles_with_stylist: true,
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && userRole && userRole !== 'customer') {
      navigate('/stylist');
    }
  }, [user, userRole, authLoading, navigate]);

  // Load existing customer profile
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user) return;
      
      let { data: existingCustomer } = await supabase
        .from("customers")
        .select("*, customer_photos(*)")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!existingCustomer && user.email) {
        const { data: customerByEmail } = await supabase
          .from("customers")
          .select("*, customer_photos(*)")
          .eq("email", user.email)
          .maybeSingle();
        
        if (customerByEmail) {
          // Link existing orphaned record to current user
          const { error: linkError } = await supabase
            .from("customers")
            .update({ user_id: user.id })
            .eq("id", customerByEmail.id);
          
          if (!linkError) {
            existingCustomer = { ...customerByEmail, user_id: user.id };
          } else {
            console.error("Failed to link customer to user:", linkError);
            // Still set existingCustomer to prevent duplicate insert
            existingCustomer = customerByEmail;
          }
        }
      }
      
      // Extract name from Google OAuth metadata
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      
      if (existingCustomer) {
        setExistingCustomerId(existingCustomer.id);
        setFormData({
          email: existingCustomer.email || user.email || "",
          phone: existingCustomer.phone || "",
          name: existingCustomer.name || googleName || "",
          gender: existingCustomer.gender || "",
          age: existingCustomer.age?.toString() || "",
          preferred_style_description: existingCustomer.preferred_style_description || "",
          preferred_style_category: existingCustomer.preferred_style_category || "",
          share_ai_styles_with_stylist: existingCustomer.share_ai_styles_with_stylist ?? true,
        });
        
        if (existingCustomer.customer_photos) {
          const photoMap: Record<string, string> = {};
          existingCustomer.customer_photos.forEach((p: any) => {
            photoMap[p.photo_type] = p.photo_url;
          });
          setPhotos(photoMap);
        }
      } else {
        // Pre-fill from Google OAuth for new users
        setFormData(prev => ({ 
          ...prev, 
          email: user.email || "",
          name: googleName || ""
        }));
      }
    };
    
    loadExistingProfile();
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (formData.gender) {
      fetchHairStyles(formData.gender);
    }
  }, [formData.gender]);

  const fetchHairStyles = async (gender: string) => {
    const { data } = await supabase
      .from("hair_styles")
      .select("*")
      .or(`gender.eq.${gender},gender.eq.unisex`);
    
    if (data) {
      setHairStyles(data);
    }
  };

  const handlePhotoUpload = async (photoType: string, file: File) => {
    if (!user) return;
    setUploadingPhoto(photoType);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${photoType}.${fileExt}`;
    const filePath = `${user.id}/customer-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-photos")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: t("common.error"), description: uploadError.message, variant: "destructive" });
      setUploadingPhoto(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("user-photos")
      .getPublicUrl(filePath);

    setPhotos((prev) => ({ ...prev, [photoType]: urlData.publicUrl }));
    setUploadingPhoto(null);
  };

  const handleDeletePhoto = (photoType: string) => {
    setPhotos((prev) => {
      const updated = { ...prev };
      delete updated[photoType];
      return updated;
    });
    toast({ title: t("customer.profile.photoRemoved", "Photo removed"), description: t("customer.profile.rememberToSave", "Remember to save your profile") });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("auth.notAuthenticated", "Not authenticated"), variant: "destructive" });
      return;
    }
    
    if (!formData.name || !formData.gender) {
      toast({ title: t("customer.profile.requiredFields", "Required fields missing"), description: t("customer.profile.fillNameGender", "Please fill in name and gender"), variant: "destructive" });
      return;
    }

    if (Object.keys(photos).length < 2) {
      toast({ title: t("customer.profile.photosRequired", "Photos required"), description: t("customer.profile.uploadPhotos", "Please upload at least 2 photos of your hair"), variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let customerId: string;

      if (existingCustomerId) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: formData.name,
            phone: formData.phone,
            gender: formData.gender,
            age: formData.age ? parseInt(formData.age) : null,
            preferred_style_description: formData.preferred_style_description,
            preferred_style_category: formData.preferred_style_category,
            latitude: location?.lat,
            longitude: location?.lng,
            share_ai_styles_with_stylist: formData.share_ai_styles_with_stylist,
          })
          .eq("id", existingCustomerId);

        if (error) throw error;
        customerId = existingCustomerId;
      } else {
        const { data: newCustomer, error } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            email: user.email || formData.email,
            phone: formData.phone,
            name: formData.name,
            gender: formData.gender,
            age: formData.age ? parseInt(formData.age) : null,
            preferred_style_description: formData.preferred_style_description,
            preferred_style_category: formData.preferred_style_category,
            latitude: location?.lat,
            longitude: location?.lng,
            share_ai_styles_with_stylist: formData.share_ai_styles_with_stylist,
          })
          .select()
          .single();

        if (error) throw error;
        customerId = newCustomer.id;
        setExistingCustomerId(customerId);
      }

      // Delete existing photos first
      const { error: deleteError } = await supabase
        .from("customer_photos")
        .delete()
        .eq("customer_id", customerId);
      
      if (deleteError) {
        console.error("Error deleting existing photos:", deleteError);
      }

      // Insert new photos
      if (Object.keys(photos).length > 0) {
        const photoInserts = Object.entries(photos).map(([type, url]) => ({
          customer_id: customerId,
          photo_url: url,
          photo_type: type,
        }));

        const { error: insertError } = await supabase
          .from("customer_photos")
          .insert(photoInserts);
        
        if (insertError) {
          console.error("Error inserting photos:", insertError);
          toast({ 
            title: t("common.error"), 
            description: t("customer.profile.photoSaveError", "Failed to save photos"), 
            variant: "destructive" 
          });
          return;
        }
      }

      sessionStorage.setItem("customerId", customerId);

      toast({ title: t("customer.profile.profileSaved", "Profile saved!"), description: t("customer.profile.letsGenerate", "Let's generate your new look") });
      navigate("/customer/style");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
              aria-label={t("common.back")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
                {existingCustomerId ? t("customer.profile.editProfile") : t("customer.profile.createProfile", "Create Your Profile")}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSwitcher variant="icon" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut} 
                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground"
                aria-label={t("auth.signOut")}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Basic Info Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">{t("customer.profile.fullName", "Full Name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("customer.profile.enterName", "Enter your fullname")}
                className="h-12 border-2 focus:border-primary"
              />
            </div>

            {/* Gender Selection - Pill Style with proper touch targets */}
            <div className="space-y-2">
              <Label className="font-medium">{t("customer.profile.gender")}</Label>
              <div className="flex items-center justify-center gap-2">
                {["male", "female", "other"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender })}
                    className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-all capitalize active:scale-95 ${
                      formData.gender === gender
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.gender === gender 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {formData.gender === gender && (
                        <span className="w-2 h-2 bg-primary-foreground rounded-full" />
                      )}
                    </span>
                    {t(`customer.profile.${gender}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Guided Photo Capture */}
            <GuidedPhotoCapture
              photos={photos}
              onPhotoCapture={handlePhotoUpload}
              onPhotoDelete={handleDeletePhoto}
              uploadingPhoto={uploadingPhoto}
            />

            {/* Age Input */}
            <div className="space-y-2">
              <Label htmlFor="age" className="font-medium">{t("customer.profile.age")}</Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder={t("customer.profile.enterAge", "Enter your age")}
                className="h-12 border-2 focus:border-primary"
              />
            </div>

            {/* Style Description */}
            <div className="space-y-2">
              <Textarea
                value={formData.preferred_style_description}
                onChange={(e) => setFormData({ ...formData, preferred_style_description: e.target.value })}
                placeholder={t("customer.profile.styleDescription", "Describe your ideal hair style...")}
                className="border-2 focus:border-primary min-h-[80px]"
              />
            </div>

            {/* Visual Hair Style Selection */}
            {formData.gender && hairStyles.length > 0 && (
              <div className="space-y-2">
                <Label className="font-medium">{t("customer.profile.chooseStyle", "Choose Your Style")}</Label>
                <HairStyleSelector
                  styles={hairStyles}
                  selectedStyle={formData.preferred_style_category}
                  onSelect={(styleName) => setFormData({ ...formData, preferred_style_category: styleName })}
                />
              </div>
            )}

            {location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" /> {t("customer.profile.locationDetected", "Location detected for finding nearby stylists")}
              </p>
            )}
          </div>

          {/* Notification Settings */}
          <div className="p-4 border-2 border-primary/20 rounded-xl bg-card">
            <h3 className="text-sm font-medium text-foreground mb-3">{t("customer.profile.appointmentReminders", "Appointment Reminders")}</h3>
            <NotificationToggle variant="switch" showLabel={true} />
            <p className="text-xs text-muted-foreground mt-2">
              {t("customer.profile.reminderDescription", "Get push notifications 1 hour before your appointments")}
            </p>
          </div>

          {/* AI Style Sharing Toggle */}
          <div className="p-4 border-2 border-primary/20 rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">{t("customer.profile.shareAiStyles", "Share AI Styles with Stylist")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("customer.profile.shareAiStylesDescription", "Allow stylists to see your AI-generated hairstyle previews when booking")}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.share_ai_styles_with_stylist}
                onCheckedChange={(checked) => setFormData({ ...formData, share_ai_styles_with_stylist: checked })}
              />
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={showPayment ? () => setShowPayment(false) : () => setShowPayment(true)}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {showPayment ? t("customer.profile.hidePayment", "Hide Payment") : t("customer.profile.connectStripe", "Connect to Stripe")}
          </Button>

          {showPayment && <PaymentMethodUI onClose={() => setShowPayment(false)} />}

          {/* Continue Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
          >
            {loading ? t("common.saving", "Saving...") : t("common.continue")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
