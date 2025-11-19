import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface StyleStepProps {
  prompt: string;
  onUpdate: (prompt: string) => void;
  onNext: () => void;
  onBack: () => void;
  userId: string;
  photos: string[];
  setGeneratedImages: (images: string[]) => void;
}

const StyleStep = ({
  prompt,
  onUpdate,
  onNext,
  onBack,
  userId,
  photos,
  setGeneratedImages,
}: StyleStepProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please describe your style",
        description: "We need a description to generate your hairstyle options.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hairstyle', {
        body: {
          stylePrompt: prompt,
          userPhotoUrl: photos[0],
        },
      });

      if (error) throw error;

      if (data.variations && data.variations.length > 0) {
        setGeneratedImages(data.variations);

        await supabase.from('hairstyle_requests').insert({
          user_id: userId,
          style_prompt: prompt,
        });

        toast({
          title: "Styles generated!",
          description: "Check out your personalized hairstyle options.",
        });
        onNext();
      } else {
        throw new Error("No variations generated");
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate hairstyles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Describe Your Dream Style</h2>
          <p className="text-muted-foreground">Tell us what hairstyle you're envisioning</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="style">Style Description</Label>
          <Textarea
            id="style"
            value={prompt}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="E.g., Short bob with bangs, layered and textured, modern and chic look, warm blonde highlights..."
            rows={6}
            className="rounded-xl resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be specific! Mention length, texture, color, and any special features you want.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={generating}
            className="flex-1 rounded-xl h-12"
          >
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Styles"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StyleStep;
