import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, ArrowRight, CreditCard, MapPin, LogOut, X } from "lucide-react";
import PaymentMethodUI from "@/components/stripe/PaymentMethodUI";

const photoTypes = [
  { id: "front", label: "Front View" },
  { id: "left", label: "Left Side" },
  { id: "right", label: "Right Side" },
  { id: "back", label: "Back View" },
  { id: "top", label: "Top View" },
];

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      
      // First try to find by user_id
      let { data: existingCustomer } = await supabase
        .from("customers")
        .select("*, customer_photos(*)")
        .eq("user_id", user.id)
        .maybeSingle();
      
      // If not found by user_id, check by email (in case profile was created before auth link)
      if (!existingCustomer && user.email) {
        const { data: customerByEmail } = await supabase
          .from("customers")
          .select("*, customer_photos(*)")
          .eq("email", user.email)
          .maybeSingle();
        
        if (customerByEmail) {
          // Link this customer to the auth user
          await supabase
            .from("customers")
            .update({ user_id: user.id })
            .eq("id", customerByEmail.id);
          
          existingCustomer = customerByEmail;
        }
      }
      
      if (existingCustomer) {
        setExistingCustomerId(existingCustomer.id);
        setFormData({
          email: existingCustomer.email || user.email || "",
          phone: existingCustomer.phone || "",
          name: existingCustomer.name || "",
          gender: existingCustomer.gender || "",
          age: existingCustomer.age?.toString() || "",
          preferred_style_description: existingCustomer.preferred_style_description || "",
          preferred_style_category: existingCustomer.preferred_style_category || "",
        });
        
        // Load existing photos
        if (existingCustomer.customer_photos) {
          const photoMap: Record<string, string> = {};
          existingCustomer.customer_photos.forEach((p: any) => {
            photoMap[p.photo_type] = p.photo_url;
          });
          setPhotos(photoMap);
        }
      } else {
        // Pre-fill email from auth
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }
    };
    
    loadExistingProfile();
  }, [user]);

  useEffect(() => {
    // Request geolocation
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
    setUploadingPhoto(photoType);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${photoType}.${fileExt}`;
    const filePath = `customer-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-photos")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
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
    toast({ title: "Photo removed", description: "Remember to save your profile" });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }
    
    if (!formData.name || !formData.gender) {
      toast({ title: "Required fields missing", description: "Please fill in name and gender", variant: "destructive" });
      return;
    }

    if (Object.keys(photos).length < 2) {
      toast({ title: "Photos required", description: "Please upload at least 2 photos of your hair", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let customerId: string;

      if (existingCustomerId) {
        // Update existing customer
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
          })
          .eq("id", existingCustomerId);

        if (error) throw error;
        customerId = existingCustomerId;
      } else {
        // Create new customer linked to auth user
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
          })
          .select()
          .single();

        if (error) throw error;
        customerId = newCustomer.id;
        setExistingCustomerId(customerId);
      }

      // Delete existing photos and add new ones
      await supabase.from("customer_photos").delete().eq("customer_id", customerId);

      const photoInserts = Object.entries(photos).map(([type, url]) => ({
        customer_id: customerId,
        photo_url: url,
        photo_type: type,
      }));

      await supabase.from("customer_photos").insert(photoInserts);

      // Store customer ID in session storage for the flow
      sessionStorage.setItem("customerId", customerId);

      toast({ title: "Profile saved!", description: "Let's generate your new look" });
      navigate("/customer/style");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{existingCustomerId ? "Edit Your Profile" : "Create Your Profile"}</h1>
            <p className="text-muted-foreground">Tell us about yourself and your hair goals</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
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
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || formData.email}
                  disabled
                  className="bg-muted"
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
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Your age"
                className="w-32"
              />
            </div>

            {location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Location detected for finding nearby stylists
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Your Hair Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photoTypes.map((type) => (
                <div key={type.id} className="space-y-2">
                  <Label>{type.label}</Label>
                  <div className="relative">
                    <label className="block cursor-pointer">
                      <div className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                        photos[type.id] ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}>
                        {photos[type.id] ? (
                          <img src={photos[type.id]} alt={type.label} className="w-full h-full object-cover rounded-lg" />
                        ) : uploadingPhoto === type.id ? (
                          <div className="animate-pulse text-muted-foreground">Uploading...</div>
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
                          if (file) handlePhotoUpload(type.id, file);
                        }}
                      />
                    </label>
                    {photos[type.id] && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePhoto(type.id);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.gender && (
              <div className="space-y-2">
                <Label>Preferred Style</Label>
                <Select
                  value={formData.preferred_style_category}
                  onValueChange={(v) => setFormData({ ...formData, preferred_style_category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {hairStyles.map((style) => (
                      <SelectItem key={style.id} value={style.name}>
                        {style.name} - {style.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Describe Your Ideal Style</Label>
              <Textarea
                value={formData.preferred_style_description}
                onChange={(e) => setFormData({ ...formData, preferred_style_description: e.target.value })}
                placeholder="Describe your dream hairstyle in detail... e.g., 'A modern fade with textured top, slightly longer on the sides'"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPayment(true)}
            >
              Add Payment Method
            </Button>
            {showPayment && <PaymentMethodUI onClose={() => setShowPayment(false)} />}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {loading ? "Saving..." : "Continue"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;