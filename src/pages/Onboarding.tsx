import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProfileStep from "@/components/onboarding/ProfileStep";
import PhotoStep from "@/components/onboarding/PhotoStep";
import StyleStep from "@/components/onboarding/StyleStep";
import ResultsStep from "@/components/onboarding/ResultsStep";
import StylistStep from "@/components/onboarding/StylistStep";
import BookingStep from "@/components/onboarding/BookingStep";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    name: "",
    gender: "",
    email: "",
    phone: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [stylePrompt, setStylePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedStylist, setSelectedStylist] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkExistingProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkExistingProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfileData({
        name: data.name,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
      });
    }
  };

  const steps = [
    <ProfileStep
      key="profile"
      data={profileData}
      onUpdate={setProfileData}
      onNext={() => setCurrentStep(1)}
      userId={user?.id}
    />,
    <PhotoStep
      key="photo"
      photos={uploadedPhotos}
      onUpdate={setUploadedPhotos}
      onNext={() => setCurrentStep(2)}
      onBack={() => setCurrentStep(0)}
      userId={user?.id}
    />,
    <StyleStep
      key="style"
      prompt={stylePrompt}
      onUpdate={setStylePrompt}
      onNext={() => setCurrentStep(3)}
      onBack={() => setCurrentStep(1)}
      userId={user?.id}
      photos={uploadedPhotos}
      setGeneratedImages={setGeneratedImages}
    />,
    <ResultsStep
      key="results"
      images={generatedImages}
      selectedImage={selectedImage}
      onSelect={setSelectedImage}
      onNext={() => setCurrentStep(4)}
      onBack={() => setCurrentStep(2)}
    />,
    <StylistStep
      key="stylist"
      selectedStylist={selectedStylist}
      onSelect={setSelectedStylist}
      onNext={() => setCurrentStep(5)}
      onBack={() => setCurrentStep(3)}
    />,
    <BookingStep
      key="booking"
      stylist={selectedStylist}
      selectedImage={selectedImage}
      userId={user?.id}
      stylePrompt={stylePrompt}
      onBack={() => setCurrentStep(4)}
    />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-rose-light/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Your Style Journey
            </h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {steps[currentStep]}
      </div>
    </div>
  );
};

export default Onboarding;
