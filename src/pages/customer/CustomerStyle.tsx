import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowRight, ArrowLeft, Check, ChevronLeft, Loader2 } from "lucide-react";
import { AIPreviewGenerator } from "@/components/ai/AIPreviewGenerator";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

const CustomerStyle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
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
      
      const { data: styles } = await supabase
        .from("hair_styles")
        .select("*")
        .or(`gender.eq.${customerData.gender},gender.eq.unisex`);
      
      if (styles) setHairStyles(styles);
    }

    const { data: photoData } = await supabase
      .from("customer_photos")
      .select("*")
      .eq("customer_id", customerId);

    if (photoData) setPhotos(photoData);

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
    setGenerationProgress(0);
    
    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 1000);

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
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  const selectImage = async (imageId: string) => {
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
      <div className="min-h-screen bg-background p-4">
        <SkeletonLoader stage="loading" className="min-h-[80vh]" />
      </div>
    );
  }

  const selectedGeneratedImage = generatedImages.find(img => img.id === selectedImage);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/customer")}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-foreground pr-8">
            Preview Your New Look
          </h1>
        </div>

        {/* AI Preview Generator with comparison slider */}
        <AIPreviewGenerator
          isGenerating={generating}
          progress={generationProgress}
          beforeImage={photos.find(p => p.photo_type === "front")?.photo_url}
          afterImage={selectedGeneratedImage?.generated_image_url}
        />

        {/* Generated Thumbnails */}
        {generatedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {generatedImages.slice(0, 4).map((img) => (
              <button
                key={img.id}
                onClick={() => selectImage(img.id)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all ${
                  selectedImage === img.id 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.generated_image_url}
                  alt="Generated style"
                  className="w-full h-full object-cover"
                />
                {selectedImage === img.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Style Description Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="font-semibold text-foreground">Hair Style Description</Label>
              <Textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="Style: Wavy Bob, Length: Shoulder; Color: Blonde; Texture: Loose Waves; Occasion: Casual"
                className="mt-2 border-2 focus:border-primary min-h-[80px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 border-2 font-medium"
                onClick={() => {
                  const basePrompts = [
                    "Style: Modern Bob, Length: Chin; Color: Natural; Texture: Sleek",
                    "Style: Layered Cut, Length: Medium; Color: Highlights; Texture: Wavy",
                    "Style: Pixie, Length: Short; Color: Bold; Texture: Textured",
                  ];
                  setStylePrompt(basePrompts[Math.floor(Math.random() * basePrompts.length)]);
                }}
              >
                Adjust Description
              </Button>
              <Button 
                onClick={generateStyle}
                disabled={generating}
                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Preview
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/customer")}
                className="h-12 border-2 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={continueToBooking}
                disabled={!selectedImage}
                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                Approve & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerStyle;
