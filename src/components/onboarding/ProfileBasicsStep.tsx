import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MapPin } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";

interface ProfileBasicsStepProps {
  formData: {
    name: string;
    phone: string;
    business_name: string;
    address: string;
  };
  setFormData: (data: any) => void;
  photoUrl: string;
  uploadingPhoto: boolean;
  onPhotoUpload: (file: File) => void;
  location: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
}

export const ProfileBasicsStep = ({
  formData,
  setFormData,
  photoUrl,
  uploadingPhoto,
  onPhotoUpload,
  location,
  onLocationChange,
}: ProfileBasicsStepProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stylist.onboarding.profilePhoto")}</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block cursor-pointer mx-auto w-32">
            <div
              className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center transition-colors overflow-hidden ${
                photoUrl ? "border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : uploadingPhoto ? (
                <div className="animate-pulse text-muted-foreground text-sm">{t("onboardingSteps.uploading")}</div>
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
                if (file) onPhotoUpload(file);
              }}
            />
          </label>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {t("onboardingSteps.photoBoost")}
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            {t("onboardingSteps.basicInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("onboardingSteps.yourName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">{t("stylist.onboarding.businessName")}</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder={t("onboardingSteps.salonName")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("common.phone")}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("common.address")}</Label>
            <AddressAutocomplete
              id="address"
              value={formData.address}
              onChange={(address) => setFormData({ ...formData, address })}
              onPlaceSelect={(place) => {
                setFormData({ ...formData, address: place.address });
                onLocationChange?.({ lat: place.lat, lng: place.lng });
              }}
              placeholder={t("onboardingSteps.addressPlaceholder")}
            />
          </div>

          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {t("onboardingSteps.locationDetected")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
