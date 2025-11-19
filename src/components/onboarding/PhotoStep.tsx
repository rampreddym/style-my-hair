import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, X } from "lucide-react";

interface PhotoStepProps {
  photos: string[];
  onUpdate: (photos: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  userId: string;
}

const PhotoStep = ({ photos, onUpdate, onNext, onBack, userId }: PhotoStepProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('user-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        await supabase.from('user_photos').insert({
          user_id: userId,
          photo_url: publicUrl,
        });
      }

      onUpdate([...photos, ...uploadedUrls]);
      toast({
        title: "Photos uploaded!",
        description: `${uploadedUrls.length} photo(s) added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onUpdate(newPhotos);
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Upload Your Photos</h2>
          <p className="text-muted-foreground">Add photos to help us visualize your new style</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden">
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-destructive/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-secondary/50">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Add Photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 rounded-xl h-12"
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={photos.length === 0 || uploading}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {uploading ? "Uploading..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoStep;
