import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StylistLocationLinkProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  stylistName?: string;
  variant?: "inline" | "button" | "card";
  className?: string;
}

/**
 * Opens location in native maps app:
 * - iOS: Apple Maps
 * - Android/Desktop: Google Maps
 */
const openInMaps = (address?: string, latitude?: number, longitude?: number, label?: string) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (latitude && longitude) {
    // Use coordinates for precise location
    if (isIOS) {
      // Apple Maps with coordinates and label
      const appleMapsUrl = `maps://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(label || address || 'Stylist Location')}`;
      window.open(appleMapsUrl, '_blank');
    } else {
      // Google Maps with coordinates
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  } else if (address) {
    // Fall back to address search
    if (isIOS) {
      const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(address)}`;
      window.open(appleMapsUrl, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(googleMapsUrl, '_blank');
    }
  }
};

export const StylistLocationLink = ({ 
  address, 
  latitude, 
  longitude, 
  stylistName,
  variant = "inline",
  className 
}: StylistLocationLinkProps) => {
  if (!address && !latitude) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInMaps(address, latitude, longitude, stylistName);
  };

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={cn("gap-2", className)}
      >
        <Navigation className="w-4 h-4" />
        Get Directions
      </Button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors",
          "flex items-center gap-3 text-left active:scale-[0.99]",
          className
        )}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">View on Map</p>
          {address && (
            <p className="text-xs text-muted-foreground truncate">{address}</p>
          )}
        </div>
        <Navigation className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  // Inline variant (default)
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors",
        "underline-offset-2 hover:underline",
        className
      )}
    >
      <MapPin className="w-3 h-3" />
      <span className="truncate">{address || "View Location"}</span>
    </button>
  );
};

export { openInMaps };
