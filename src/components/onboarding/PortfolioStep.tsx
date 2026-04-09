import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Plus, X, Image } from "lucide-react";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface PortfolioPhoto {
  id?: string;
  image_url: string;
  hair_type?: string;
  style_type?: string;
}

interface PortfolioStepProps {
  portfolio: PortfolioPhoto[];
  setPortfolio: (photos: PortfolioPhoto[]) => void;
  stylistId?: string;
}

const HAIR_TYPES = ["Straight", "Wavy", "Curly", "Coily"];
const STYLE_TYPES = ["Short", "Medium", "Long", "Color", "Braids", "Fades"];

export const PortfolioStep = ({ portfolio, setPortfolio, stylistId }: PortfolioStepProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `portfolio-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/portfolio-photos/${fileName}`;

    const { error } = await supabase.storage.from("user-photos").upload(filePath, file);

    if (error) {
      toast({ title: t("onboardingSteps.uploadFailed"), description: getUserFriendlyError(error), variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(filePath);

    setPortfolio([...portfolio, { image_url: urlData.publicUrl }]);
    setUploading(false);
    toast({ title: t("onboardingSteps.photoAdded") });
  };

  const removePhoto = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
    setSelectedPhoto(null);
  };

  const updatePhotoTags = (index: number, field: "hair_type" | "style_type", value: string) => {
    const updated = [...portfolio];
    if (updated[index][field] === value) {
      updated[index][field] = undefined;
    } else {
      updated[index][field] = value;
    }
    setPortfolio(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-accent" />
            {t("onboardingSteps.yourPortfolio")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-primary">
              📸 {t("onboardingSteps.portfolioBoost")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("onboardingSteps.includeHairTypes")}
            </p>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-3">
            {portfolio.map((photo, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  selectedPhoto === index ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
                onClick={() => setSelectedPhoto(selectedPhoto === index ? null : index)}
              >
                <img src={photo.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Tags indicator */}
                {(photo.hair_type || photo.style_type) && (
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    {photo.hair_type && (
                      <span className="bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                        {photo.hair_type}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add photo button */}
            {portfolio.length < 9 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                {uploading ? (
                  <div className="animate-pulse text-muted-foreground text-sm">{t("onboardingSteps.uploading")}</div>
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">{t("stylist.onboarding.addPhoto")}</span>
                  </>
                )}
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
            )}
          </div>

          {/* Tags for selected photo */}
          {selectedPhoto !== null && portfolio[selectedPhoto] && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <p className="text-sm font-medium">{t("onboardingSteps.tagPhoto")}</p>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("onboardingSteps.hairType")}</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={portfolio[selectedPhoto].hair_type === type ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updatePhotoTags(selectedPhoto, "hair_type", type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("onboardingSteps.styleType")}</p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={portfolio[selectedPhoto].style_type === type ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updatePhotoTags(selectedPhoto, "style_type", type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {t("onboardingSteps.photosCount", { count: portfolio.length, max: 9 })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
