import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SkeletonLoaderProps {
  stage?: string;
  progress?: number;
  tip?: string;
  className?: string;
}

const loadingTips = [
  "Pro tip: Thick curly hair works great with textured styles!",
  "Did you know? Regular trims every 6-8 weeks keep your style fresh.",
  "Tip: Show your stylist reference photos for best results.",
  "Fun fact: The average person has about 100,000 hair follicles.",
  "Pro tip: Describe specific lengths (e.g., '0.5 inches on sides').",
  "Tip: Consider your face shape when choosing a new style.",
];

const stageMessages: Record<string, string> = {
  uploadingPhotos: "Uploading hair photos...",
  generatingPreview: "Creating your new look...",
  searchingStylists: "Finding stylists near you...",
  processingPayment: "Processing payment...",
  loading: "Loading...",
};

export const SkeletonLoader = ({ 
  stage = "loading", 
  progress = 0, 
  tip,
  className 
}: SkeletonLoaderProps) => {
  const randomTip = tip || loadingTips[Math.floor(Math.random() * loadingTips.length)];
  const message = stageMessages[stage] || stageMessages.loading;

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 space-y-6", className)}>
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted" />
        <div 
          className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"
        />
        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">{message}</p>
        {progress > 0 && (
          <div className="w-48 mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="max-w-xs text-center">
        <p className="text-sm text-muted-foreground italic">💡 {randomTip}</p>
      </div>
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton = ({ count = 3, className }: CardSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ImageSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("bg-muted rounded-xl animate-pulse", className)}>
      <div className="aspect-square flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
};

export const FormSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="h-12 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-12 bg-muted rounded" />
      </div>
      <div className="h-12 bg-muted rounded" />
    </div>
  );
};
