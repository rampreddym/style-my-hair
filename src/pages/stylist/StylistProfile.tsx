import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, ArrowRight, MapPin, Sparkles, X } from "lucide-react";

const StylistProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
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
    setUploadingPhoto(true);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `stylist-${Date.now()}.${fileExt}`;
    const filePath = `stylist-photos/${fileName}`;

    const { error } = await supabase.storage
      .from("user-photos")
      .upload(filePath, file);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
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

  const generateSpecialties = async () => {
    if (!formData.bio) {
      toast({ title: "Please add a bio first", variant: "destructive" });
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
      
      toast({ title: "Specialties generated!" });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.name) {
      toast({ title: "Required fields missing", description: "Please fill in email and name", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: existingStylist } = await supabase
        .from("stylists")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      let stylistId: string;

      if (existingStylist) {
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
          .eq("id", existingStylist.id);

        if (error) throw error;
        stylistId = existingStylist.id;
      } else {
        const { data: newStylist, error } = await supabase
          .from("stylists")
          .insert({
            email: formData.email,
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
        stylistId = newStylist.id;
      }

      sessionStorage.setItem("stylistId", stylistId);
      toast({ title: "Profile saved!" });
      navigate("/stylist/services");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Create Your Stylist Profile</h1>
          <p className="text-muted-foreground">Showcase your skills and attract new clients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block cursor-pointer mx-auto w-32">
              <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center transition-colors overflow-hidden ${
                photoUrl ? "border-primary" : "border-border hover:border-primary/50"
              }`}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
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

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell clients about your experience, style philosophy, and what makes you unique..."
                rows={4}
              />
            </div>

            {location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Location detected for client matching
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Specialties</span>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSpecialties}
                disabled={generating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : "AI Suggest"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Add a specialty..."
                onKeyPress={(e) => e.key === "Enter" && addSpecialty()}
              />
              <Button onClick={addSpecialty} variant="outline">Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="px-3 py-1">
                  {specialty}
                  <button onClick={() => removeSpecialty(specialty)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-accent to-primary hover:opacity-90"
          >
            {loading ? "Saving..." : "Continue"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StylistProfile;