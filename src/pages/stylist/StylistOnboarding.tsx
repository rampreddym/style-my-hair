import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, LogOut, CheckCircle } from "lucide-react";
import { StepProgress } from "@/components/ui/step-progress";
import { ProfileBasicsStep } from "@/components/onboarding/ProfileBasicsStep";
import { ExperienceStep } from "@/components/onboarding/ExperienceStep";
import { PortfolioStep } from "@/components/onboarding/PortfolioStep";
import { AvailabilityStep } from "@/components/onboarding/AvailabilityStep";
import { PayoutStep } from "@/components/onboarding/PayoutStep";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface PortfolioPhoto {
  id?: string;
  image_url: string;
  hair_type?: string;
  style_type?: string;
}

interface DayAvailability {
  day: number;
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const STEP_LABELS = ["Profile", "Experience", "Portfolio", "Availability", "Payment"];

const StylistOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading: authLoading, signOut } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingStylistId, setExistingStylistId] = useState<string | null>(null);

  // Step 1: Profile Basics
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    business_name: "",
    address: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Step 2: Experience
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  // Step 3: Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([]);

  // Step 4: Availability
  const [availability, setAvailability] = useState<DayAvailability[]>([]);

  // Step 5: Payout
  const [stripeOnboarded, setStripeOnboarded] = useState(false);

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (!authLoading && userRole && userRole !== "stylist") {
      navigate("/customer");
    }
  }, [user, userRole, authLoading, navigate]);

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: stylist } = await supabase
        .from("stylists")
        .select("id, name, phone, business_name, address, photo_url, bio, years_experience, specialties, certifications")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch stripe/onboarding status via secure RPC (column-restricted on table)
      const { data: stripeStatusRows } = await supabase.rpc("get_my_stylist_stripe_status");
      const stripeStatus = Array.isArray(stripeStatusRows) ? stripeStatusRows[0] : (stripeStatusRows as any);

      if (stylist) {
        setExistingStylistId(stylist.id);
        setFormData({
          name: stylist.name || "",
          phone: stylist.phone || "",
          business_name: stylist.business_name || "",
          address: stylist.address || "",
        });
        setPhotoUrl(stylist.photo_url || "");
        setBio(stylist.bio || "");
        setYearsExperience(stylist.years_experience || 0);
        setSpecialties(stylist.specialties || []);
        setCertifications(stylist.certifications || []);
        setStripeOnboarded(stripeStatus?.stripe_onboarded || false);
        setCurrentStep(stripeStatus?.onboarding_step || 1);

        // Load portfolio
        const { data: portfolioData } = await supabase
          .from("stylist_portfolio")
          .select("*")
          .eq("stylist_id", stylist.id);

        if (portfolioData) {
          setPortfolio(portfolioData);
        }

        // Load availability
        const { data: availData } = await supabase
          .from("stylist_availability")
          .select("*")
          .eq("stylist_id", stylist.id);

        if (availData && availData.length > 0) {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          setAvailability(
            availData.map((a) => ({
              day: a.day_of_week,
              dayName: dayNames[a.day_of_week],
              isAvailable: a.is_available,
              startTime: a.start_time,
              endTime: a.end_time,
            }))
          );
        }
      }
    };

    loadProfile();
  }, [user]);

  // Geolocation
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

    const { error } = await supabase.storage.from("user-photos").upload(filePath, file);

    if (error) {
      toast({ title: "Upload failed", description: getUserFriendlyError(error), variant: "destructive" });
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(filePath);
    setPhotoUrl(urlData.publicUrl);
    setUploadingPhoto(false);
  };

  const saveProgress = async (nextStep: number) => {
    if (!user) return;

    setLoading(true);
    try {
      let stylistId = existingStylistId;

      // Upsert stylist
      if (existingStylistId) {
        const { error } = await supabase
          .from("stylists")
          .update({
            name: formData.name,
            phone: formData.phone,
            business_name: formData.business_name,
            address: formData.address,
            bio,
            years_experience: yearsExperience,
            specialties,
            certifications,
            photo_url: photoUrl,
            latitude: location?.lat,
            longitude: location?.lng,
            onboarding_step: nextStep,
            onboarding_completed: nextStep > 5,
          })
          .eq("id", existingStylistId);

        if (error) throw error;
      } else {
        const { data: newStylist, error } = await supabase
          .from("stylists")
          .insert({
            user_id: user.id,
            email: user.email,
            name: formData.name,
            phone: formData.phone,
            business_name: formData.business_name,
            address: formData.address,
            bio,
            years_experience: yearsExperience,
            specialties,
            certifications,
            photo_url: photoUrl,
            latitude: location?.lat,
            longitude: location?.lng,
            onboarding_step: nextStep,
          })
          .select()
          .single();

        if (error) throw error;
        stylistId = newStylist.id;
        setExistingStylistId(stylistId);
      }

      // Save portfolio
      if (currentStep === 3 && stylistId) {
        // Delete old portfolio
        await supabase.from("stylist_portfolio").delete().eq("stylist_id", stylistId);
        // Insert new
        if (portfolio.length > 0) {
          await supabase.from("stylist_portfolio").insert(
            portfolio.map((p) => ({
              stylist_id: stylistId,
              image_url: p.image_url,
              hair_type: p.hair_type,
              style_type: p.style_type,
            }))
          );
        }
      }

      // Save availability
      if (currentStep === 4 && stylistId) {
        await supabase.from("stylist_availability").delete().eq("stylist_id", stylistId);
        if (availability.length > 0) {
          await supabase.from("stylist_availability").insert(
            availability.map((a) => ({
              stylist_id: stylistId,
              day_of_week: a.day,
              start_time: a.startTime,
              end_time: a.endTime,
              is_available: a.isAvailable,
            }))
          );
        }
      }

      sessionStorage.setItem("stylistId", stylistId!);
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validation
    if (currentStep === 1 && !formData.name) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    if (currentStep === 5) {
      // Final step - complete onboarding with flag set to true
      const success = await saveProgress(6);
      if (success) {
        toast({ title: "Onboarding complete!" });
        navigate("/stylist/services");
      }
    } else {
      // Move to next step
      const success = await saveProgress(currentStep + 1);
      if (success) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConnectStripe = () => {
    // In real app, redirect to Stripe Connect
    toast({ title: "Stripe connection coming soon!" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {existingStylistId ? "Complete Your Profile" : "Create Your Stylist Profile"}
            </h1>
            <p className="text-muted-foreground">Step {currentStep} of 5</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <StepProgress currentStep={currentStep} totalSteps={5} stepLabels={STEP_LABELS} />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <ProfileBasicsStep
              formData={formData}
              setFormData={setFormData}
              photoUrl={photoUrl}
              uploadingPhoto={uploadingPhoto}
              onPhotoUpload={handlePhotoUpload}
              location={location}
            />
          )}
          {currentStep === 2 && (
            <ExperienceStep
              bio={bio}
              setBio={setBio}
              yearsExperience={yearsExperience}
              setYearsExperience={setYearsExperience}
              specialties={specialties}
              setSpecialties={setSpecialties}
              certifications={certifications}
              setCertifications={setCertifications}
            />
          )}
          {currentStep === 3 && (
            <PortfolioStep
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              stylistId={existingStylistId || undefined}
            />
          )}
          {currentStep === 4 && (
            <AvailabilityStep availability={availability} setAvailability={setAvailability} />
          )}
          {currentStep === 5 && (
            <PayoutStep stripeOnboarded={stripeOnboarded} onConnectStripe={handleConnectStripe} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-accent to-primary hover:opacity-90"
          >
            {loading ? "Saving..." : currentStep === 5 ? "Complete Setup" : "Continue"}
            {currentStep === 5 ? (
              <CheckCircle className="w-4 h-4 ml-2" />
            ) : (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Skip hint */}
        {currentStep > 1 && currentStep < 5 && (
          <p className="text-center text-sm text-muted-foreground">
            You can skip this step and complete it later
          </p>
        )}
      </div>
    </div>
  );
};

export default StylistOnboarding;
