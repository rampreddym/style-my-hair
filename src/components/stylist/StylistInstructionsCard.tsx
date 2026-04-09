import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, RefreshCw, ChevronDown, ChevronUp, Clipboard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserFriendlyError } from '@/lib/errorHandler';

interface StylistInstructionsCardProps {
  appointmentId: string;
  serviceName: string;
  styleDescription?: string | null;
  styleImageUrl?: string | null;
  customerGender?: string | null;
  customerAge?: number | null;
  preferredStyleDescription?: string | null;
  previousNotes?: string | null;
  existingInstructions?: string | null;
  onInstructionsGenerated?: (instructions: string) => void;
}

export const StylistInstructionsCard = ({
  appointmentId,
  serviceName,
  styleDescription,
  styleImageUrl,
  customerGender,
  customerAge,
  preferredStyleDescription,
  previousNotes,
  existingInstructions,
  onInstructionsGenerated,
}: StylistInstructionsCardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(existingInstructions || null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInstructions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-stylist-instructions", {
        body: {
          serviceName,
          styleDescription,
          styleImageUrl,
          customerGender,
          customerAge,
          preferredStyleDescription,
          previousNotes,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const generatedInstructions = data.instructions;
      setInstructions(generatedInstructions);

      // Save to database
      await supabase
        .from("appointments")
        .update({ stylist_instructions: generatedInstructions })
        .eq("id", appointmentId);

      onInstructionsGenerated?.(generatedInstructions);

      toast({
        title: t("stylist.instructions.generated"),
        description: t("stylist.instructions.generatedDescription"),
      });
    } catch (error: any) {
      console.error("Error generating instructions:", error);
      toast({
        title: t("common.error"),
        description: getUserFriendlyError(error) || t("stylist.instructions.generationFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!instructions) return;
    
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      toast({
        title: t("stylist.instructions.copied"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("common.error"),
        variant: "destructive",
      });
    }
  };

  // Format instructions with markdown-like styling
  const formatInstructions = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Bold headers (lines starting with ** or ##)
      if (line.match(/^\*\*.*\*\*$/) || line.match(/^##/)) {
        const cleanLine = line.replace(/\*\*/g, '').replace(/^##\s*/, '');
        return (
          <h4 key={index} className="font-bold text-foreground mt-4 mb-2 text-sm">
            {cleanLine}
          </h4>
        );
      }
      // Numbered items
      if (line.match(/^\d+\.\s/)) {
        return (
          <p key={index} className="ml-4 text-sm text-muted-foreground mb-1">
            {line}
          </p>
        );
      }
      // Bullet points
      if (line.match(/^[-•]\s/)) {
        return (
          <p key={index} className="ml-6 text-sm text-muted-foreground mb-1">
            {line}
          </p>
        );
      }
      // Regular text
      if (line.trim()) {
        return (
          <p key={index} className="text-sm text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return <br key={index} />;
    });
  };

  const previewText = instructions 
    ? instructions.substring(0, 200) + (instructions.length > 200 ? '...' : '')
    : null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          {t("stylist.instructions.title")}
          <Badge variant="secondary" className="ml-auto text-xs">
            AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!instructions ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t("stylist.instructions.description")}
            </p>
            <Button
              onClick={generateInstructions}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t("stylist.instructions.generating")}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {t("stylist.instructions.generate")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            <div className="bg-background/50 rounded-lg p-3 border">
              <div className="text-sm text-muted-foreground">
                {expanded ? formatInstructions(instructions) : previewText}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    {t("common.showLess")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    {t("common.showMore")}
                  </>
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    {t("stylist.instructions.copied")}
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 mr-1" />
                    {t("stylist.instructions.copy")}
                  </>
                )}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-4 h-4 mr-1" />
                    {t("stylist.instructions.viewFull")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t("stylist.instructions.title")} - {serviceName}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-1">
                      {formatInstructions(instructions)}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                          {t("stylist.instructions.copied")}
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-4 h-4 mr-1" />
                          {t("stylist.instructions.copy")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateInstructions}
                      disabled={loading}
                      className="flex-1"
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
                      {t("stylist.instructions.regenerate")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
