import { Card } from "@/components/ui/card";
import { Star, MapPin, CheckCircle, Scissors, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StylistService {
  id: string;
  name: string;
  price: number;
  duration_minutes?: number;
}

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
  services?: StylistService[];
  /** e.g. ["Today 2:30 PM", "Tomorrow 10:00 AM"] */
  nextSlots?: string[];
  onSlotSelect?: (slot: string) => void;
  isFavourite?: boolean;
}

export const EnhancedStylistCard = ({
  stylist,
  isSelected,
  onSelect,
  recentWork = [],
  services = [],
  nextSlots = [],
  onSlotSelect,
  isFavourite = false,
}: EnhancedStylistCardProps) => {
  const travelTime = stylist.distance ? Math.round(stylist.distance * 3) : null;
  const isNew = !stylist.total_reviews || stylist.total_reviews === 0;

  const sortedServices = [...services].sort((a, b) => a.price - b.price);
  const startingPrice = sortedServices.length > 0 ? sortedServices[0].price : null;
  const topServices = sortedServices.slice(0, 3);

  // Portfolio strip: real work first, fall back to the profile photo
  const strip = recentWork.length > 0
    ? recentWork.slice(0, 4)
    : stylist.photo_url
      ? [stylist.photo_url]
      : [];

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "cursor-pointer overflow-hidden no-tap-highlight transition-all active:scale-[0.99]",
        isSelected ? "border-primary" : "hover:border-primary/40"
      )}
    >
      {/* Work-first hero strip */}
      {strip.length > 0 && (
        <div className={cn("grid gap-px bg-border", strip.length === 1 ? "grid-cols-1" : "grid-cols-4")}>
          {strip.map((src, i) => (
            <div
              key={i}
              className={cn(
                "bg-secondary overflow-hidden",
                strip.length === 1 ? "h-40" : "h-24"
              )}
            >
              <img
                src={src}
                alt={`${stylist.name} work sample ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Identity row */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border">
              {stylist.photo_url ? (
                <img src={stylist.photo_url} alt={stylist.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg text-primary">{stylist.name.charAt(0)}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center border-2 border-card">
              <CheckCircle className="w-2.5 h-2.5 text-accent-foreground" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg text-foreground truncate leading-tight">{stylist.name}</h3>
              {isFavourite && (
                <span className="eyebrow text-primary shrink-0">Booked before</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {isNew ? (
                <span className="inline-flex items-center gap-1 text-accent">
                  <Sparkles className="w-3 h-3" /> New stylist
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Star className="w-3 h-3 fill-current text-primary" />
                  {stylist.rating?.toFixed(1)}
                  <span className="text-muted-foreground">({stylist.total_reviews})</span>
                </span>
              )}
              {stylist.distance !== undefined && stylist.distance !== null && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {stylist.distance.toFixed(1)} km{travelTime ? ` · ~${travelTime} min` : ""}
                </span>
              )}
            </div>
          </div>

          {startingPrice !== null && (
            <div className="text-right shrink-0">
              <p className="eyebrow text-muted-foreground">From</p>
              <p className="font-display text-lg text-foreground leading-tight">${startingPrice.toFixed(0)}</p>
            </div>
          )}
        </div>

        {/* Price list — what customers scan next */}
        {topServices.length > 0 && (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {topServices.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1.5 text-sm">
                <Scissors className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-foreground truncate">{s.name}</span>
                <span className="ml-auto text-muted-foreground shrink-0 tabular-nums">
                  ${s.price.toFixed(0)}
                  {s.duration_minutes ? ` · ${s.duration_minutes}m` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Availability — the conversion element */}
        {nextSlots.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {nextSlots.slice(0, 3).map((slot) => (
              <button
                key={slot}
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotSelect ? onSlotSelect(slot) : onSelect();
                }}
                className="shrink-0 px-3 py-1.5 rounded-full border border-primary/40 text-primary text-xs whitespace-nowrap hover:bg-primary/10 transition-colors"
              >
                {slot}
              </button>
            ))}
          </div>
        )}

        {/* Specialties, quiet */}
        {stylist.specialties && stylist.specialties.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {stylist.specialties.slice(0, 4).join(" · ")}
          </p>
        )}
      </div>
    </Card>
  );
};
