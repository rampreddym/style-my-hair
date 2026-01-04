import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Smile, Meh, Frown, Angry, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackOption {
  emoji: string;
  icon: React.ReactNode;
  label: string;
  sentiment: "love" | "happy" | "okay" | "not_great" | "upset";
  color: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { emoji: "😍", icon: <Heart className="w-8 h-8" />, label: "Love it!", sentiment: "love", color: "text-pink-500" },
  { emoji: "😊", icon: <Smile className="w-8 h-8" />, label: "Happy", sentiment: "happy", color: "text-green-500" },
  { emoji: "😐", icon: <Meh className="w-8 h-8" />, label: "Okay", sentiment: "okay", color: "text-yellow-500" },
  { emoji: "😕", icon: <Frown className="w-8 h-8" />, label: "Not great", sentiment: "not_great", color: "text-orange-500" },
  { emoji: "😠", icon: <Angry className="w-8 h-8" />, label: "Upset", sentiment: "upset", color: "text-red-500" },
];

const ISSUE_TYPES = [
  "Style didn't match expectations",
  "Took too long",
  "Communication issues",
  "Unprofessional behavior",
  "Pricing issues",
  "Other",
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
          title: "Thank you for your feedback!",
          description: "We're glad you had a great experience.",
        });
      } else if (selectedSentiment.sentiment === "not_great" || selectedSentiment.sentiment === "upset") {
        toast({
          title: "We're sorry to hear that",
          description: "Our team will reach out to make things right.",
        });
      } else {
        toast({ title: "Feedback submitted!" });
      }

      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>How was your appointment?</CardTitle>
        <p className="text-muted-foreground text-sm">
          With {stylistName}
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
              <span className="text-xs text-muted-foreground">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Follow-up for negative feedback */}
        {showFollowUp && (
          <div className="space-y-4 animate-in slide-in-from-top-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive">
                We're sorry you didn't have a great experience.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please let us know what went wrong so we can make it right.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">What was the issue?</p>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TYPES.map((issue) => (
                  <Button
                    key={issue}
                    variant={issueType === issue ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIssueType(issue)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tell us more (optional)</p>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe what happened..."
                rows={3}
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary">
                🎁 We'd like to make this right
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your feedback, we may offer a free touch-up or partial refund.
                Our team will contact you within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Positive feedback encouragement */}
        {selectedSentiment && (selectedSentiment.sentiment === "love" || selectedSentiment.sentiment === "happy") && (
          <div className="space-y-4 animate-in slide-in-from-top-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-700">
                We're so happy you loved it!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Consider leaving a detailed review to help others find great stylists.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Share what you loved (optional)</p>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What made your experience great?"
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
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
