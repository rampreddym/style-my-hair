import { useState, useEffect, useRef } from "react";
import { Loader2, Lightbulb, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPreviewGeneratorProps {
  isGenerating: boolean;
  progress: number;
  beforeImage?: string;
  afterImage?: string;
  onProgressUpdate?: (progress: number) => void;
}

const generationTips = [
  "Pro tip: Thick curly hair works great with textured styles!",
  "Did you know? Your face shape affects which styles look best on you.",
  "Tip: Describe specific lengths for better results (e.g., '2 inches on top').",
  "Fun fact: Hair grows about 6 inches per year on average.",
  "Pro tip: Mention your hair texture for more accurate previews.",
  "Tip: Consider your lifestyle when choosing a new style.",
];

const generationStages = [
  { progress: 0, message: "Analyzing your photo..." },
  { progress: 20, message: "Understanding your hair type..." },
  { progress: 40, message: "Applying style preferences..." },
  { progress: 60, message: "Generating variations..." },
  { progress: 80, message: "Refining details..." },
  { progress: 95, message: "Almost ready..." },
];

export const AIPreviewGenerator = ({
  isGenerating,
  progress,
  beforeImage,
  afterImage,
}: AIPreviewGeneratorProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Rotate tips
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % generationTips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Get current stage message
  const currentStage = generationStages.reduce((acc, stage) => 
    progress >= stage.progress ? stage : acc
  , generationStages[0]);

  // Handle comparison slider
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  if (isGenerating) {
    return (
      <div className="relative aspect-square bg-muted/30 rounded-2xl overflow-hidden border-2 border-border">
        {/* Background image (faded) */}
        {beforeImage && (
          <img 
            src={beforeImage} 
            alt="Your photo" 
            className="w-full h-full object-cover opacity-30"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          {/* Animated spinner */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-muted" />
            <div 
              className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>

          {/* Progress */}
          <div className="w-full max-w-xs space-y-3">
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">{currentStage.message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ~{Math.max(5, Math.round(45 - (progress * 0.45)))} seconds remaining
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Rotating tips */}
          <div className="mt-8 max-w-xs text-center animate-fade-in">
            <div className="flex items-start gap-2 bg-primary/5 rounded-xl p-4">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{generationTips[currentTip]}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show comparison slider when we have before and after
  if (beforeImage && afterImage && showComparison) {
    return (
      <div className="space-y-3">
        <div 
          ref={sliderRef}
          className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border cursor-ew-resize select-none"
          onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e.clientX)}
          onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
        >
          {/* After image (full) */}
          <img 
            src={afterImage} 
            alt="After" 
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Before image (clipped) */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img 
              src={beforeImage} 
              alt="Before" 
              className="w-full h-full object-cover"
              style={{ 
                width: sliderRef.current?.offsetWidth || '100%',
                maxWidth: 'none'
              }}
            />
          </div>

          {/* Slider line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded text-white text-xs">
            Before
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-white text-xs">
            After
          </div>
        </div>

        <button
          onClick={() => setShowComparison(false)}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          Hide comparison
        </button>
      </div>
    );
  }

  // Default: show after image with comparison toggle
  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-muted/30 rounded-2xl overflow-hidden border-2 border-border">
        {afterImage ? (
          <img 
            src={afterImage} 
            alt="Generated style" 
            className="w-full h-full object-cover"
          />
        ) : beforeImage ? (
          <img 
            src={beforeImage} 
            alt="Your photo" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No photo available
          </div>
        )}
      </div>

      {beforeImage && afterImage && (
        <button
          onClick={() => setShowComparison(true)}
          className="w-full py-2 text-sm text-primary hover:underline flex items-center justify-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Compare before/after
        </button>
      )}
    </div>
  );
};
