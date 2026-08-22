import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  MapPin, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ChevronRight,
  Zap,
  History
} from "lucide-react";
import { LastBooking, StylistMatch } from "@/hooks/useSmartBookingSuggestion";

interface SmartBookingSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  lastBooking: LastBooking | null;
  aiRecommendations: StylistMatch[];
  loading: boolean;
  onSelectStylist: (stylistId: string) => void;
  onAutoSelect: () => void;
}

export const SmartBookingSuggestionDialog = ({
  open,
  onOpenChange,
  serviceName,
  lastBooking,
  aiRecommendations,
  loading,
  onSelectStylist,
  onAutoSelect,
}: SmartBookingSuggestionDialogProps) => {
  const { t } = useTranslation();
  const [showAiOptions, setShowAiOptions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null) return null;
    return distance < 1 
      ? `${(distance * 1000).toFixed(0)}m` 
      : `${distance.toFixed(1)}km`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("booking.smartSuggestion.title", "Smart Booking")}
          </DialogTitle>
          <DialogDescription>
            {t("booking.smartSuggestion.description", "We found options based on your history for {{service}}", { service: serviceName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Last Booking Section */}
          {lastBooking && !showAiOptions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <History className="w-4 h-4" />
                {t("booking.smartSuggestion.lastBooking", "Your last booking")}
              </div>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => onSelectStylist(lastBooking.stylist_id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3 items-center">
                    {lastBooking.stylist_photo_url ? (
                      <img
                        src={lastBooking.stylist_photo_url}
                        alt={lastBooking.stylist_name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {lastBooking.stylist_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{lastBooking.stylist_name}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-warning fill-yellow-500" />
                        {lastBooking.stylist_rating.toFixed(1)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(lastBooking.appointment_date)}
                        <span>•</span>
                        {lastBooking.service_name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground">
                {t("booking.smartSuggestion.or", "or")}
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAiOptions(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t("booking.smartSuggestion.findBestMatch", "Find best match with AI")}
              </Button>
            </div>
          )}

          {/* AI Recommendations Section */}
          {(showAiOptions || !lastBooking) && (
            <div className="space-y-3">
              {lastBooking && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAiOptions(false)}
                  className="mb-2"
                >
                  ← {t("common.back", "Back")}
                </Button>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t("booking.smartSuggestion.aiRecommendations", "AI Recommendations")}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t("booking.smartSuggestion.basedOn", "Rating + Proximity + Service")}
                </Badge>
              </div>

              {/* Auto-select option */}
              <Card 
                className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 cursor-pointer hover:border-primary transition-colors"
                onClick={onAutoSelect}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {t("booking.smartSuggestion.letAiChoose", "Let AI choose the best")}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("booking.smartSuggestion.autoSelectDesc", "We'll pick the optimal stylist and proceed to booking")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Stylist list */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : aiRecommendations.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("booking.smartSuggestion.noMatches", "No stylists offer this service nearby")}
                </p>
              ) : (
                <div className="space-y-2">
                  {aiRecommendations.map((stylist, index) => (
                    <Card 
                      key={stylist.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => onSelectStylist(stylist.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3 items-center">
                          <div className="relative">
                            {index === 0 && (
                              <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center bg-warning">
                                1
                              </Badge>
                            )}
                            {stylist.photo_url ? (
                              <img
                                src={stylist.photo_url}
                                alt={stylist.name}
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {stylist.name?.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{stylist.name}</h4>
                              {index === 0 && (
                                <Badge variant="outline" className="text-xs bg-warning/10 text-yellow-700 border-warning/30">
                                  {t("booking.smartSuggestion.bestMatch", "Best")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-warning fill-yellow-500" />
                                {stylist.rating.toFixed(1)}
                              </span>
                              {stylist.distance !== null && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {formatDistance(stylist.distance)}
                                </span>
                              )}
                              {stylist.servicePrice && (
                                <span className="font-medium text-primary">
                                  ${stylist.servicePrice}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t("booking.smartSuggestion.browseAll", "Browse all stylists instead")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
