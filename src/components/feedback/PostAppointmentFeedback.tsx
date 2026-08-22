import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Smile, Meh, Frown, Angry, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface FeedbackOption {
  emoji: string;
  icon: React.ReactNode;
  labelKey: string;
  sentiment: "love" | "happy" | "okay" | "not_great" | "upset";
  color: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { emoji: "😍", icon: <Heart className="w-8 h-8" />, labelKey: "postFeedback.sentiments.love", sentiment: "love", color: "text-pink-500" },
  { emoji: "😊", icon: <Smile className="w-8 h-8" />, labelKey: "postFeedback.sentiments.happy", sentiment: "happy", color: "text-success" },
  { emoji: "😐", icon: <Meh className="w-8 h-8" />, labelKey: "postFeedback.sentiments.okay", sentiment: "okay", color: "text-warning" },
  { emoji: "😕", icon: <Frown className="w-8 h-8" />, labelKey: "postFeedback.sentiments.notGreat", sentiment: "not_great", color: "text-orange-500" },
  { emoji: "😠", icon: <Angry className="w-8 h-8" />, labelKey: "postFeedback.sentiments.upset", sentiment: "upset", color: "text-red-500" },
];

const ISSUE_TYPE_KEYS = [
  "postFeedback.issues.styleMismatch",
  "postFeedback.issues.tookTooLong",
  "postFeedback.issues.communication",
  "postFeedback.issues.unprofessional",
  "postFeedback.issues.pricing",
  "postFeedback.issues.other",
];

interface PostAppointmentFeedbackProps {
  appointmentId: string;
  customerId: string;
  stylistName: string;
  onComplete: () => void;
}

export const PostAppointmentFeedback = ({
  appointmentId,
  customerId,
  stylistName,
  onComplete,
}: PostAppointmentFeedbackProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedSentiment, setSelectedSentiment] = useState<FeedbackOption | null>(null);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const handleSentimentSelect = (option: FeedbackOption) => {
    setSelectedSentiment(option);
    if (option.sentiment === "not_great" || option.sentiment === "upset") {
      setShowFollowUp(true);
    } else {
      setShowFollowUp(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedSentiment) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointment_feedback").insert({
        appointment_id: appointmentId,
        customer_id: customerId,
        sentiment: selectedSentiment.sentiment,
        feedback_text: feedbackText || null,
        issue_type: issueType,
        resolution_status: 
          selectedSentiment.sentiment === "not_great" || selectedSentiment.sentiment === "upset"
            ? "pending"
            : "resolved",
      });

      if (error) throw error;

      if (selectedSentiment.sentiment === "love" || selectedSentiment.sentiment === "happy") {
        toast({
          title: t("postFeedback.thankYou"),
          description: t("postFeedback.gladGreatExperience"),
        });
      } else if (selectedSentiment.sentiment === "not_great" || selectedSentiment.sentiment === "upset") {
        toast({
          title: t("postFeedback.sorryToHear"),
          description: t("postFeedback.teamWillReach"),
        });
      } else {
        toast({ title: t("postFeedback.feedbackSubmitted") });
      }

      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>{t("postFeedback.title")}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {t("postFeedback.withStylist", { stylist: stylistName })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emoji Selection */}
        <div className="flex justify-center gap-4">
          {FEEDBACK_OPTIONS.map((option) => (
            <button
              key={option.sentiment}
              onClick={() => handleSentimentSelect(option)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                selectedSentiment?.sentiment === option.sentiment
                  ? `bg-muted ring-2 ring-primary`
                  : "hover:bg-muted/50"
              )}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="text-xs text-muted-foreground">{t(option.labelKey)}</span>
            </button>
          ))}
        </div>

        {/* Follow-up for negative feedback */}
        {showFollowUp && (
          <div className="space-y-4 animate-in slide-in-from-top-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive">
                {t("postFeedback.sorryNotGreat")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("postFeedback.letUsKnow")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("postFeedback.whatWasIssue")}</p>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TYPE_KEYS.map((issueKey) => (
                  <Button
                    key={issueKey}
                    variant={issueType === issueKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIssueType(issueKey)}
                  >
                    {t(issueKey)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("postFeedback.tellUsMore")}</p>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t("postFeedback.describePlaceholder")}
                rows={3}
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary">
                🎁 {t("postFeedback.makeItRight")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("postFeedback.makeItRightDesc")}
              </p>
            </div>
          </div>
        )}

        {/* Positive feedback encouragement */}
        {selectedSentiment && (selectedSentiment.sentiment === "love" || selectedSentiment.sentiment === "happy") && (
          <div className="space-y-4 animate-in slide-in-from-top-4">
            <div className="bg-success/12 border border-success/25 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-success">
                {t("postFeedback.happyYouLovedIt")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("postFeedback.considerReview")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("postFeedback.shareWhatYouLoved")}</p>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t("postFeedback.whatMadeGreatPlaceholder")}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        {selectedSentiment && (
          <Button
            onClick={submitFeedback}
            disabled={submitting || (showFollowUp && !issueType)}
            className="w-full"
          >
            {submitting ? t("postFeedback.submitting") : t("postFeedback.submit")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
