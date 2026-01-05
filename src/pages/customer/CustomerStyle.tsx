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
import { CustomerLayout } from "@/components/layout/CustomerLayout";

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
      <CustomerLayout>
        <div className="min-h-screen bg-background p-4">
          <SkeletonLoader stage="loading" className="min-h-[80vh]" />
        </div>
      </CustomerLayout>
    );
  }

  const selectedGeneratedImage = generatedImages.find(img => img.id === selectedImage);

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate("/customer")}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
              aria-label="Go back"
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
                  className={`relative flex-shrink-0 w-20 h-20 min-w-[44px] min-h-[44px] rounded-xl overflow-hidden transition-all active:scale-95 ${
                    selectedImage === img.id 
                      ? "ring-2 ring-primary ring-offset-2" 
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.generated_image_url}
                    alt="Generated style"
                    className="w-full h-full object-cover"
                  />
                  {selectedImage === img.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary-foreground drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Style Selection */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Style Category</Label>
                <div className="flex flex-wrap gap-2">
                  {hairStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium transition-all active:scale-95 ${
                        selectedStyle === style.name
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stylePrompt" className="font-medium">Describe Your Style</Label>
                <Textarea
                  id="stylePrompt"
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="E.g., Short fade on sides, textured on top, modern look..."
                  className="min-h-[80px] border-2 focus:border-primary"
                />
              </div>

              <Button
                onClick={generateStyle}
                disabled={generating || (!stylePrompt && !selectedStyle)}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating ({Math.round(generationProgress)}%)
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Preview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/customer")}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={continueToBooking}
                  disabled={!selectedImage}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Approve
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerStyle;
