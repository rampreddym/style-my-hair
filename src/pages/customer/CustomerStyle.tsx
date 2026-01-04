import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, ArrowRight, ArrowLeft, Check } from "lucide-react";

const CustomerStyle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [hairStyles, setHairStyles] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [stylePrompt, setStylePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");

  const customerId = sessionStorage.getItem("customerId");

  useEffect(() => {
    if (!customerId) {
      navigate("/customer");
      return;
    }
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    
    const { data: customerData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerData) {
      setCustomer(customerData);
      setStylePrompt(customerData.preferred_style_description || "");
      setSelectedStyle(customerData.preferred_style_category || "");
      
      // Fetch hair styles based on gender
      const { data: styles } = await supabase
        .from("hair_styles")
        .select("*")
        .or(`gender.eq.${customerData.gender},gender.eq.unisex`);
      
      if (styles) setHairStyles(styles);
    }

    // Fetch customer photos
    const { data: photoData } = await supabase
      .from("customer_photos")
      .select("*")
      .eq("customer_id", customerId);

    if (photoData) setPhotos(photoData);

    // Fetch existing generated styles
    const { data: existingStyles } = await supabase
      .from("customer_generated_styles")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (existingStyles) {
      setGeneratedImages(existingStyles);
      const selected = existingStyles.find((s) => s.selected);
      if (selected) setSelectedImage(selected.id);
    }

    setLoading(false);
  };

  const generateStyle = async () => {
    if (!stylePrompt && !selectedStyle) {
      toast({ title: "Please describe your style", variant: "destructive" });
      return;
    }

    const frontPhoto = photos.find((p) => p.photo_type === "front");
    if (!frontPhoto) {
      toast({ title: "Front photo required", description: "Please upload a front-facing photo", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const fullPrompt = `${selectedStyle ? selectedStyle + ": " : ""}${stylePrompt}`;

      const { data, error } = await supabase.functions.invoke("generate-hairstyle", {
        body: {
          stylePrompt: fullPrompt,
          userPhotoUrl: frontPhoto.photo_url,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      // Save generated images - the API returns "variations" array
      if (data?.variations && data.variations.length > 0) {
        const inserts = data.variations.map((img: string) => ({
          customer_id: customerId,
          style_prompt: fullPrompt,
          generated_image_url: img,
        }));

        const { data: saved, error: saveError } = await supabase
          .from("customer_generated_styles")
          .insert(inserts)
          .select();

        if (saveError) {
          console.error("Error saving generated styles:", saveError);
          throw saveError;
        }

        if (saved) {
          setGeneratedImages([...saved, ...generatedImages]);
        }
        
        toast({ title: "Styles generated!", description: `${data.variations.length} new looks created` });
      } else {
        toast({ title: "No images generated", description: "Please try again with a different description", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const selectImage = async (imageId: string) => {
    // Deselect all, then select the chosen one
    await supabase
      .from("customer_generated_styles")
      .update({ selected: false })
      .eq("customer_id", customerId);

    await supabase
      .from("customer_generated_styles")
      .update({ selected: true })
      .eq("id", imageId);

    setSelectedImage(imageId);
    toast({ title: "Style selected!" });
  };

  const continueToBooking = () => {
    if (!selectedImage) {
      toast({ title: "Please select a style first", variant: "destructive" });
      return;
    }
    navigate("/customer/booking");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Generate Your New Look</h1>
          <p className="text-muted-foreground">See yourself with your dream hairstyle using AI</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Look</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img src={photo.photo_url} alt={photo.photo_type} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Style Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Choose a Base Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {hairStyles.map((style) => (
                      <SelectItem key={style.id} value={style.name}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Describe Your Style</Label>
                <Textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="Add specific details... e.g., 'with highlights, textured layers, swept to the side'"
                  rows={4}
                />
              </div>

              <Button
                onClick={generateStyle}
                disabled={generating}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Style
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {generatedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Generated Looks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => selectImage(img.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === img.id ? "ring-4 ring-primary" : "hover:ring-2 hover:ring-primary/50"
                    }`}
                  >
                    <img
                      src={img.generated_image_url}
                      alt="Generated style"
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === img.id && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                      <p className="text-xs text-foreground truncate">{img.style_prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/customer")} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <Button
            onClick={continueToBooking}
            disabled={!selectedImage}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Find Stylists
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerStyle;