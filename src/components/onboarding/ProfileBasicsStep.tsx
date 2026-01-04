import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MapPin } from "lucide-react";

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
}

export const ProfileBasicsStep = ({
  formData,
  setFormData,
  photoUrl,
  uploadingPhoto,
  onPhotoUpload,
  location,
}: ProfileBasicsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
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
                <div className="animate-pulse text-muted-foreground text-sm">Uploading...</div>
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
            Profiles with photos get 40% more bookings
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Salon or business name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Your salon or studio address"
            />
          </div>

          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" /> Location detected for client matching
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
