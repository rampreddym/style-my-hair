import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, ArrowRight, MapPin, Sparkles, X, LogOut, Image, Plus } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { StylistLayout } from "@/components/layout/StylistLayout";
import { GoogleReviewImport } from "@/components/reviews/GoogleReviewImport";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface PortfolioPhoto {
  id?: string;
  image_url: string;
  hair_type?: string;
  style_type?: string;
}

const StylistProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [existingStylistId, setExistingStylistId] = useState<string | null>(null);
  
  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    name: "",
    business_name: "",
    bio: "",
    address: "",
  });

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && userRole && userRole !== 'stylist') {
      navigate('/customer');
    }
  }, [user, userRole, authLoading, navigate]);

  // Handle Google Business OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const storedStylistId = sessionStorage.getItem("google_business_stylist_id");

    if (code && storedStylistId) {
      sessionStorage.removeItem("google_business_stylist_id");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);

      const importReviews = async () => {
        toast({ title: "Importing reviews...", description: "Connecting to your Google Business account" });
        try {
          const { data, error } = await supabase.functions.invoke("google-business-import-reviews", {
            body: {
              code,
              redirectUri: `${window.location.origin}/stylist/profile`,
              stylistId: storedStylistId,
            },
          });
          if (error) throw error;
          toast({
            title: "Reviews imported!",
            description: `Successfully imported ${data?.reviewsImported || 0} reviews from Google Business`,
          });
        } catch (err: any) {
          console.error("Google Business import error:", err);
          toast({
            title: "Import failed",
            description: getUserFriendlyError(err) || "Could not import reviews. Please try again.",
            variant: "destructive",
          });
        }
      };
      importReviews();
    }
  }, []);

  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user) return;
      
      const { data: existingStylist } = await supabase
        .from("stylists")
        .select("id, email, phone, name, business_name, bio, specialties, photo_url, latitude, longitude, address, google_place_id, rating, total_reviews, created_at, updated_at, user_id, onboarding_completed, years_experience, certifications, availability_status, language_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingStylist) {
        setExistingStylistId(existingStylist.id);
        setFormData({
          email: existingStylist.email || user.email || "",
          phone: existingStylist.phone || "",
          name: existingStylist.name || "",
          business_name: existingStylist.business_name || "",
          bio: existingStylist.bio || "",
          address: existingStylist.address || "",
        });
        setSpecialties(existingStylist.specialties || []);
        setPhotoUrl(existingStylist.photo_url || "");
        setGooglePlaceId(existingStylist.google_place_id || null);
        
        // Load portfolio photos
        const { data: portfolioData } = await supabase
          .from("stylist_portfolio")
          .select("*")
          .eq("stylist_id", existingStylist.id);
        
        if (portfolioData) {
          setPortfolio(portfolioData);
        }
      } else {
        // Pre-fill email from auth
        setFormData(prev => ({ ...prev, email: user.email || "" }));
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
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;
    setUploadingPhoto(true);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `stylist-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/stylist-photos/${fileName}`;

    const { error } = await supabase.storage
      .from("user-photos")
      .upload(filePath, file);

    if (error) {
      toast({ title: t("common.error"), description: getUserFriendlyError(error), variant: "destructive" });
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("user-photos")
      .getPublicUrl(filePath);

    setPhotoUrl(urlData.publicUrl);
    setUploadingPhoto(false);
  };

  const addSpecialty = () => {
    if (newSpecialty && !specialties.includes(newSpecialty)) {
      setSpecialties([...specialties, newSpecialty]);
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty));
  };

  // Portfolio photo upload
  const handlePortfolioUpload = async (file: File) => {
    if (!user) return;
    setUploadingPortfolio(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `portfolio-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/portfolio-photos/${fileName}`;

    const { error } = await supabase.storage.from("user-photos").upload(filePath, file);

    if (error) {
      toast({ title: t("common.error"), description: getUserFriendlyError(error), variant: "destructive" });
      setUploadingPortfolio(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(filePath);
    
    // If stylist exists, save to DB immediately
    if (existingStylistId) {
      const { data: newPhoto, error: insertError } = await supabase
        .from("stylist_portfolio")
        .insert({
          stylist_id: existingStylistId,
          image_url: urlData.publicUrl,
        })
        .select()
        .single();
      
      if (insertError) {
        toast({ title: t("common.error"), description: insertError.message, variant: "destructive" });
      } else if (newPhoto) {
        setPortfolio([...portfolio, newPhoto]);
        toast({ title: "Photo added to portfolio" });
      }
    } else {
      setPortfolio([...portfolio, { image_url: urlData.publicUrl }]);
    }
    
    setUploadingPortfolio(false);
  };

  const removePortfolioPhoto = async (index: number) => {
    const photo = portfolio[index];
    
    if (photo.id && existingStylistId) {
      await supabase.from("stylist_portfolio").delete().eq("id", photo.id);
    }
    
    setPortfolio(portfolio.filter((_, i) => i !== index));
    toast({ title: "Photo removed" });
  };

  const generateSpecialties = async () => {
    if (!formData.bio) {
      toast({ title: t("stylistProfile.addBioFirst"), variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      // Simulate AI generation - in real app, call edge function
      const suggested = [
        "Fades & Tapers",
        "Color Specialist",
        "Braiding",
        "Balayage",
        "Men's Cuts",
        "Curly Hair",
        "Extensions",
        "Beard Grooming",
      ];
      
      const random = suggested.sort(() => Math.random() - 0.5).slice(0, 4);
      setSpecialties([...new Set([...specialties, ...random])]);
      
      toast({ title: t("stylistProfile.specialtiesGenerated") });
    } catch (error: any) {
      toast({ title: t("stylistProfile.generationFailed"), description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("stylistProfile.notAuthenticated"), variant: "destructive" });
      return;
    }

    if (!formData.name) {
      toast({ title: t("stylistProfile.requiredFields"), description: t("stylistProfile.fillName"), variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (existingStylistId) {
        // Update existing profile
        const { error } = await supabase
          .from("stylists")
          .update({
            name: formData.name,
            phone: formData.phone,
            business_name: formData.business_name,
            bio: formData.bio,
            address: formData.address,
            specialties: specialties,
            photo_url: photoUrl,
            latitude: location?.lat,
            longitude: location?.lng,
          })
          .eq("id", existingStylistId);

        if (error) throw error;
        toast({ title: t("stylistProfile.profileSaved") });
        // Stay on profile page for existing profiles
      } else {
        // Create new profile
        const { data: newStylist, error } = await supabase
          .from("stylists")
          .insert({
            user_id: user.id,
            email: user.email || formData.email,
            phone: formData.phone,
            name: formData.name,
            business_name: formData.business_name,
            bio: formData.bio,
            address: formData.address,
            specialties: specialties,
            photo_url: photoUrl,
            latitude: location?.lat,
            longitude: location?.lng,
          })
          .select()
          .single();

        if (error) throw error;
        setExistingStylistId(newStylist.id);
        sessionStorage.setItem("stylistId", newStylist.id);
        toast({ title: t("stylistProfile.profileSaved") });
        // Redirect to services setup for new profiles
        navigate("/stylist/services");
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <StylistLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
        </div>
      </StylistLayout>
    );
  }

  return (
    <StylistLayout>
      <div className="page-radial min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div className="text-center flex-1 space-y-2">
              <h1 className="font-display text-3xl text-foreground">{existingStylistId ? t("stylistProfile.editTitle") : t("stylistProfile.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("stylistProfile.subtitle")}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="min-w-[44px] min-h-[44px]">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("stylistProfile.profilePhoto")}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block cursor-pointer mx-auto w-32">
              <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center transition-colors overflow-hidden ${
                photoUrl ? "border-primary" : "border-border hover:border-primary/50"
              }`}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : uploadingPhoto ? (
                  <div className="animate-pulse text-muted-foreground text-sm">{t("stylistProfile.uploading")}</div>
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              {t("stylistProfile.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("stylistProfile.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("stylistProfile.namePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">{t("stylistProfile.businessName")}</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder={t("stylistProfile.businessNamePlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || formData.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("stylistProfile.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("stylistProfile.phonePlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("stylistProfile.addressLabel")}</Label>
              <AddressAutocomplete
                id="address"
                value={formData.address}
                onChange={(address) => setFormData({ ...formData, address })}
                onPlaceSelect={(place) => {
                  setFormData({ ...formData, address: place.address });
                  setLocation({ lat: place.lat, lng: place.lng });
                }}
                placeholder={t("stylistProfile.addressPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("stylistProfile.aboutYou")}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t("stylistProfile.bioPlaceholder")}
                rows={4}
              />
            </div>

            {location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {t("stylistProfile.locationDetected")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-accent" />
              Portfolio Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {portfolio.map((photo, index) => (
                <div
                  key={photo.id || index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-border"
                >
                  <img src={photo.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePortfolioPhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              {portfolio.length < 9 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  {uploadingPortfolio ? (
                    <div className="animate-pulse text-muted-foreground text-sm">Uploading...</div>
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePortfolioUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {portfolio.length} of 9 photos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("stylistProfile.specialties")}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSpecialties}
                disabled={generating}
                className="min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? t("stylistProfile.generating") : t("stylistProfile.aiSuggest")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder={t("stylistProfile.addSpecialtyPlaceholder")}
                onKeyPress={(e) => e.key === "Enter" && addSpecialty()}
                className="h-12"
              />
              <Button onClick={addSpecialty} variant="outline" className="min-h-[44px]">{t("stylistProfile.add")}</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="px-3 py-2 text-sm">
                  {specialty}
                  <button onClick={() => removeSpecialty(specialty)} className="ml-2 min-w-[20px] min-h-[20px]">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Google Review Import - Only show for existing stylists */}
        {existingStylistId && (
          <GoogleReviewImport
            stylistId={existingStylistId}
            currentPlaceId={googlePlaceId}
            onPlaceConnected={(placeId) => setGooglePlaceId(placeId)}
          />
        )}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")} className="flex-1 h-14">
            {t("stylistProfile.back")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-14 bg-gradient-to-r from-accent to-primary hover:opacity-90"
          >
            {loading ? t("stylistProfile.saving") : t("stylistProfile.continue")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
    </StylistLayout>
  );
};

export default StylistProfile;