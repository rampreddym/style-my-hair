import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, ChevronRight, X, RotateCcw, Lightbulb, AlertCircle, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PhotoGuide {
  id: string;
  label: string;
  instruction: string;
  tip: string;
  icon: string;
}

const photoGuides: PhotoGuide[] = [
  {
    id: "front",
    label: "Front View",
    instruction: "Face the camera directly",
    tip: "Keep shoulders relaxed, look straight ahead",
    icon: "👤"
  },
  {
    id: "left",
    label: "Left Side",
    instruction: "Turn 90° to your left",
    tip: "Show your hair volume and layers",
    icon: "👈"
  },
  {
    id: "right",
    label: "Right Side", 
    instruction: "Turn 90° to your right",
    tip: "Mirror the left side angle",
    icon: "👉"
  },
  {
    id: "back",
    label: "Back View",
    instruction: "Face away from camera",
    tip: "Show full hair length and texture",
    icon: "🔙"
  },
  {
    id: "top",
    label: "Top View",
    instruction: "Tilt head forward slightly",
    tip: "Bird's eye view to show thickness",
    icon: "⬆️"
  }
];

interface GuidedPhotoCaptureProps {
  photos: Record<string, string>;
  onPhotoCapture: (photoType: string, file: File) => Promise<void>;
  onPhotoDelete: (photoType: string) => void;
  uploadingPhoto: string | null;
}

export const GuidedPhotoCapture = ({
  photos,
  onPhotoCapture,
  onPhotoDelete,
  uploadingPhoto
}: GuidedPhotoCaptureProps) => {
  const { t } = useTranslation();
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedInSession, setCapturedInSession] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const currentGuide = photoGuides[currentStep];
  const completedPhotos = Object.keys(photos).length;
  const totalPhotos = photoGuides.length;

  const handleCapture = useCallback(async () => {
    try {
      // Try Capacitor camera first
      const { Camera: CapacitorCamera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      
      const image = await CapacitorCamera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1200,
        height: 1200,
      });

      if (!image.base64String) {
        throw new Error("No image captured");
      }

      const byteCharacters = atob(image.base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${image.format || 'jpeg'}` });
      const file = new File([blob], `${currentGuide.id}.${image.format || 'jpeg'}`, { type: blob.type });

      await onPhotoCapture(currentGuide.id, file);
      setCapturedInSession(prev => new Set([...prev, currentGuide.id]));
      
      // Auto-advance to next uncaptured photo
      if (currentStep < photoGuides.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 500);
      }
    } catch (error: any) {
      // Fallback to file input for web
      if (error.message?.includes("not implemented") || error.message?.includes("not available")) {
        fileInputRef.current?.click();
      } else if (error.message !== "User cancelled photos app") {
        console.error("Camera error:", error);
      }
    }
  }, [currentGuide, currentStep, onPhotoCapture]);

  const handleGalleryUpload = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onPhotoCapture(currentGuide.id, file);
      setCapturedInSession(prev => new Set([...prev, currentGuide.id]));
      
      if (currentStep < photoGuides.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 500);
      }
    }
    // Reset input
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onPhotoCapture(currentGuide.id, file);
      setCapturedInSession(prev => new Set([...prev, currentGuide.id]));
      
      if (currentStep < photoGuides.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 500);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickUpload = (photoId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await onPhotoCapture(photoId, file);
      }
    };
    input.click();
  };

  const startGuidedCapture = () => {
    // Find first empty slot
    const firstEmpty = photoGuides.findIndex(g => !photos[g.id]);
    setCurrentStep(firstEmpty >= 0 ? firstEmpty : 0);
    setIsGuidedMode(true);
  };

  if (isGuidedMode) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col safe-area-top">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
          <button 
            onClick={() => setIsGuidedMode(false)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("photoCapture.step", "Step {{current}} of {{total}}", { current: currentStep + 1, total: totalPhotos })}
            </p>
            <h2 className="text-lg font-bold text-foreground">{currentGuide.label}</h2>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Progress bar - Fixed */}
        <div className="flex-shrink-0 flex gap-1 px-4 py-2">
          {photoGuides.map((guide, idx) => (
            <div 
              key={guide.id}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                photos[guide.id] ? "bg-primary" : 
                idx === currentStep ? "bg-primary/50" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Main capture area - Scrollable */}
        <div className="flex-1 overflow-y-auto scroll-smooth-touch">
          <div className="flex flex-col items-center p-6 space-y-4 min-h-full">
            {/* Photo preview or placeholder */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-4 border-primary/20 flex-shrink-0">
              {photos[currentGuide.id] ? (
                <>
                  <img 
                    src={photos[currentGuide.id]} 
                    alt={currentGuide.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center">
                  <span className="text-5xl sm:text-6xl mb-3">{currentGuide.icon}</span>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    {currentGuide.instruction}
                  </p>
                </div>
              )}
              
              {uploadingPhoto === currentGuide.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Guidance tip */}
            <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-3 max-w-sm w-full">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{currentGuide.tip}</p>
            </div>

            {/* Quality tips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                t("photoCapture.goodLighting", "Good lighting"),
                t("photoCapture.faceVisible", "Face visible"),
                t("photoCapture.inFocus", "In focus")
              ].map((tip) => (
                <span 
                  key={tip}
                  className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                >
                  ✓ {tip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 space-y-3 border-t border-border safe-area-bottom bg-background">
          {photos[currentGuide.id] ? (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12"
                onClick={() => onPhotoDelete(currentGuide.id)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("photoCapture.retake", "Retake")}
              </Button>
              <Button 
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (currentStep < photoGuides.length - 1) {
                    setCurrentStep(prev => prev + 1);
                  } else {
                    setIsGuidedMode(false);
                  }
                }}
              >
                {currentStep < photoGuides.length - 1 ? (
                  <>{t("common.next", "Next")} <ChevronRight className="w-4 h-4 ml-2" /></>
                ) : (
                  <>{t("common.done", "Done")} <Check className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
                onClick={handleCapture}
                disabled={!!uploadingPhoto}
              >
                <Camera className="w-5 h-5 mr-2" />
                {t("photoCapture.takePhoto", "Take Photo")}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-12"
                onClick={handleGalleryUpload}
                disabled={!!uploadingPhoto}
              >
                <ImagePlus className="w-5 h-5 mr-2" />
                {t("photoCapture.upload", "Upload")}
              </Button>
            </div>
          )}

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 pt-1">
            {photoGuides.map((guide, idx) => (
              <button
                key={guide.id}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all touch-target flex items-center justify-center",
                  idx === currentStep 
                    ? "bg-primary w-6" 
                    : photos[guide.id] 
                      ? "bg-primary/60" 
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Hidden file input for camera fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        {/* Hidden file input for gallery upload */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGallerySelect}
        />
      </div>
    );
  }

  // Compact view
  return (
    <div className="space-y-4">
      {/* Main capture button */}
      <button
        type="button"
        onClick={startGuidedCapture}
        className="w-full border-2 border-dashed border-primary rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <p className="font-semibold text-foreground">
          {completedPhotos === 0 ? "Start Photo Capture" : "Continue Capture"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Guided step-by-step process
        </p>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex gap-1">
            {photoGuides.map((guide) => (
              <div 
                key={guide.id}
                className={cn(
                  "w-2 h-2 rounded-full",
                  photos[guide.id] ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {completedPhotos}/{totalPhotos} photos
          </span>
        </div>
      </button>

      {/* Photo thumbnails */}
      {completedPhotos > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Your Photos</p>
            {completedPhotos < 2 && (
              <div className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>Minimum 2 required</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {photoGuides.map((guide) => (
              <div key={guide.id} className="relative group">
                {photos[guide.id] ? (
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary">
                    <img 
                      src={photos[guide.id]} 
                      alt={guide.label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onPhotoDelete(guide.id)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-[10px] text-white text-center truncate">
                        {guide.label.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickUpload(guide.id)}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <span className="text-lg">{guide.icon}</span>
                    <p className="text-[8px] text-muted-foreground mt-0.5">
                      {guide.label.split(' ')[0]}
                    </p>
                  </button>
                )}
                
                {uploadingPhoto === guide.id && (
                  <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
