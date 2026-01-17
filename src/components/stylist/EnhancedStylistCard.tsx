import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, MapPin, Clock, CheckCircle, MessageSquare, 
  ChevronRight, Award, Camera, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { openInMaps } from "@/components/map/StylistLocationLink";
import { MapPreview } from "@/components/map/MapPreview";

interface Stylist {
  id: string;
  name: string;
  business_name?: string;
  photo_url?: string;
  rating?: number;
  total_reviews?: number;
  specialties?: string[];
  address?: string;
  distance?: number;
  bio?: string;
  latitude?: number;
  longitude?: number;
}

interface EnhancedStylistCardProps {
  stylist: Stylist;
  isSelected: boolean;
  onSelect: () => void;
  recentWork?: string[];
  matchScore?: number;
}

const proficiencyLevels: Record<string, { label: string; color: string }> = {
  expert: { label: "Expert", color: "text-primary bg-primary/10" },
  advanced: { label: "Advanced", color: "text-amber-600 bg-amber-100" },
  skilled: { label: "Skilled", color: "text-blue-600 bg-blue-100" },
};

export const EnhancedStylistCard = ({ 
  stylist, 
  isSelected, 
  onSelect,
  recentWork = [],
  matchScore
}: EnhancedStylistCardProps) => {
  const [showFullBio, setShowFullBio] = useState(false);

  // Estimate travel time (rough: 3 min per km)
  const travelTime = stylist.distance ? Math.round(stylist.distance * 3) : null;

  return (
    <Card
      onClick={onSelect}
      variant={isSelected ? "accent" : "default"}
      className={cn(
        "cursor-pointer transition-all overflow-hidden no-tap-highlight active:scale-[0.98] card-shine",
        isSelected 
          ? "ring-2 ring-primary border-primary shadow-elevated" 
          : "hover:border-primary/30 hover:shadow-elevated"
      )}
    >
      <CardContent className="p-4 relative z-10">
        {/* Header with photo and basic info */}
        <div className="flex gap-4">
          {/* Profile photo with verified badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {stylist.photo_url ? (
                <img 
                  src={stylist.photo_url} 
                  alt={stylist.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {stylist.name.charAt(0)}
                </span>
              )}
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
              <CheckCircle className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground truncate">{stylist.name}</h3>
                {stylist.business_name && (
                  <p className="text-sm text-muted-foreground truncate">{stylist.business_name}</p>
                )}
              </div>
              
              {/* Match score badge */}
              {matchScore && matchScore > 80 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  {matchScore}% match
                </Badge>
              )}
            </div>

            {/* Rating and distance */}
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                {stylist.rating?.toFixed(1) || "New"}
                {stylist.total_reviews && (
                  <span className="text-muted-foreground">
                    ({stylist.total_reviews})
                  </span>
                )}
              </span>
              {stylist.distance !== undefined && stylist.distance !== null && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openInMaps(stylist.address, stylist.latitude, stylist.longitude, stylist.name);
                  }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {stylist.distance.toFixed(1)} km
                  {travelTime && (
                    <span className="text-xs">· ~{travelTime} min</span>
                  )}
                  <Navigation className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          </div>

          <ChevronRight className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isSelected && "rotate-90"
          )} />
        </div>

        {/* Portfolio preview */}
        {recentWork.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {recentWork.slice(0, 3).map((work, i) => (
              <div 
                key={i} 
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border"
              >
                <img src={work} alt="Recent work" className="w-full h-full object-cover" />
              </div>
            ))}
            {recentWork.length > 3 && (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xs text-muted-foreground">
                +{recentWork.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Specialties with proficiency */}
        {stylist.specialties && stylist.specialties.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {stylist.specialties.slice(0, 4).map((specialty, i) => {
              const level = i === 0 ? "expert" : i === 1 ? "advanced" : "skilled";
              const { label, color } = proficiencyLevels[level];
              return (
                <span 
                  key={specialty} 
                  className={cn("text-xs px-2 py-1 rounded-full", color)}
                >
                  {specialty}
                </span>
              );
            })}
          </div>
        )}

        {/* Bio preview */}
        {stylist.bio && (
          <p 
            className={cn(
              "text-sm text-muted-foreground mt-3",
              !showFullBio && "line-clamp-2"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowFullBio(!showFullBio);
            }}
          >
            {stylist.bio}
          </p>
        )}

        {/* Map preview and quick actions on selected */}
        {isSelected && (
          <>
            {/* Map Preview */}
            {stylist.latitude && stylist.longitude && (
              <div 
                className="mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  openInMaps(stylist.address, stylist.latitude, stylist.longitude, stylist.name);
                }}
              >
                <MapPreview
                  latitude={stylist.latitude}
                  longitude={stylist.longitude}
                  label={stylist.business_name || stylist.name}
                  avatarUrl={stylist.photo_url}
                  avatarFallback={stylist.name}
                  className="h-[160px] cursor-pointer hover:opacity-90 transition-opacity"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Tap map to get directions
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 min-h-[44px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="min-h-[44px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Camera className="w-4 h-4 mr-1" />
                Portfolio
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
