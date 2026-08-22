import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, Camera, ThumbsUp, MessageSquare, 
  Check, X, ChevronDown, ChevronUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface EnhancedReviewFormProps {
  appointmentId: string;
  stylistName: string;
  serviceName: string;
  beforePhotos?: string[];
  onSubmit: (review: ReviewData) => Promise<void>;
  onSkip?: () => void;
}

export interface ReviewData {
  overallRating: number;
  aspectRatings: {
    technique: number;
    communication: number;
    cleanliness: number;
    value: number;
  };
  feedback: {
    likedMost: string;
    wouldRecommend: boolean;
    wouldRebook: boolean;
  };
  afterPhotos: string[];
  comment: string;
}

const aspectLabelKeys: Record<string, { labelKey: string; descriptionKey: string }> = {
  technique: { labelKey: "enhancedReview.aspects.technique", descriptionKey: "enhancedReview.aspects.techniqueDesc" },
  communication: { labelKey: "enhancedReview.aspects.communication", descriptionKey: "enhancedReview.aspects.communicationDesc" },
  cleanliness: { labelKey: "enhancedReview.aspects.cleanliness", descriptionKey: "enhancedReview.aspects.cleanlinessDesc" },
  value: { labelKey: "enhancedReview.aspects.value", descriptionKey: "enhancedReview.aspects.valueDesc" },
};

export const EnhancedReviewForm = ({
  stylistName,
  serviceName,
  beforePhotos = [],
  onSubmit,
  onSkip,
}: EnhancedReviewFormProps) => {
  const { t } = useTranslation();
  const [overallRating, setOverallRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState({
    technique: 0,
    communication: 0,
    cleanliness: 0,
    value: 0,
  });
  const [likedMost, setLikedMost] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [wouldRebook, setWouldRebook] = useState<boolean | null>(null);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [showAspects, setShowAspects] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        overallRating,
        aspectRatings,
        feedback: {
          likedMost,
          wouldRecommend: wouldRecommend ?? false,
          wouldRebook: wouldRebook ?? false,
        },
        afterPhotos,
        comment,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRate, 
    size = "md" 
  }: { 
    rating: number; 
    onRate: (r: number) => void;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClasses = {
      sm: "w-5 h-5",
      md: "w-8 h-8",
      lg: "w-10 h-10",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                star <= rating
                  ? "fill-amber-400 text-warning"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-center">
          {t("enhancedReview.title", { service: serviceName, stylist: stylistName })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{t("enhancedReview.tapToRate")}</p>
          <div className="flex justify-center">
            <StarRating rating={overallRating} onRate={setOverallRating} size="lg" />
          </div>
          {overallRating > 0 && (
            <p className="text-lg font-medium text-primary">
              {overallRating === 5 ? t("enhancedReview.ratings.amazing") :
               overallRating === 4 ? t("enhancedReview.ratings.great") :
               overallRating === 3 ? t("enhancedReview.ratings.good") :
               overallRating === 2 ? t("enhancedReview.ratings.fair") : t("enhancedReview.ratings.poor")}
            </p>
          )}
        </div>

        {/* Aspect Ratings (collapsible) */}
        {overallRating > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAspects(!showAspects)}
              className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">{t("enhancedReview.rateAspects")}</span>
              {showAspects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAspects && (
              <div className="p-4 space-y-4">
                {Object.entries(aspectLabelKeys).map(([key, { labelKey, descriptionKey }]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t(labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(descriptionKey)}</p>
                    </div>
                    <StarRating 
                      rating={aspectRatings[key as keyof typeof aspectRatings]} 
                      onRate={(r) => setAspectRatings(prev => ({ ...prev, [key]: r }))}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Before/After Photos */}
        {overallRating > 0 && (
          <div className="space-y-3">
            <p className="font-medium">{t("enhancedReview.addPhotos")}</p>
            <div className="flex gap-3">
              {/* Before photos */}
              {beforePhotos.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">{t("enhancedReview.before")}</p>
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-muted">
                    <img src={beforePhotos[0]} alt={t("enhancedReview.before")} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* After photos */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">{t("enhancedReview.after")}</p>
                <div className="flex gap-2">
                  {afterPhotos.map((photo, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary relative">
                      <img src={photo} alt={t("enhancedReview.after")} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setAfterPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  
                  {afterPhotos.length < 4 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">{t("common.add")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        multiple
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback prompts */}
        {overallRating > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">{t("enhancedReview.whatLikedMost")}</p>
              <Textarea
                value={likedMost}
                onChange={(e) => setLikedMost(e.target.value)}
                placeholder={t("enhancedReview.likedMostPlaceholder")}
                className="min-h-[80px] border-2"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{t("enhancedReview.wouldRecommend")}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    onClick={() => setWouldRecommend(true)}
                    className="flex-1"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {t("common.yes")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldRecommend === false ? "destructive" : "outline"}
                    onClick={() => setWouldRecommend(false)}
                    className="flex-1"
                  >
                    {t("common.no")}
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{t("enhancedReview.wouldRebook")}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldRebook === true ? "default" : "outline"}
                    onClick={() => setWouldRebook(true)}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t("common.yes")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldRebook === false ? "destructive" : "outline"}
                    onClick={() => setWouldRebook(false)}
                    className="flex-1"
                  >
                    {t("common.no")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional comment */}
        {overallRating > 0 && (
          <div className="space-y-2">
            <p className="font-medium">{t("enhancedReview.anythingElse")}</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("enhancedReview.anythingElsePlaceholder")}
              className="min-h-[60px] border-2"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="flex-1"
            >
              {t("enhancedReview.skipForNow")}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={overallRating === 0 || submitting}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {submitting ? t("enhancedReview.submitting") : t("enhancedReview.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
