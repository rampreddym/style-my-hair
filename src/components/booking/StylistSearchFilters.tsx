import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  Star,
  X,
  Sparkles,
  DollarSign,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StylistFilters {
  searchQuery: string;
  serviceType: string | null;
  minRating: number;
  maxPrice: number | null;
  specialties: string[];
  sortBy: "distance" | "rating" | "price" | "reviews";
}

interface StylistSearchFiltersProps {
  filters: StylistFilters;
  onFiltersChange: (filters: StylistFilters) => void;
  availableServices: { id: string; name: string; price: number }[];
  availableSpecialties: string[];
  maxServicePrice: number;
}

export const defaultFilters: StylistFilters = {
  searchQuery: "",
  serviceType: null,
  minRating: 0,
  maxPrice: null,
  specialties: [],
  sortBy: "distance",
};

export const StylistSearchFilters = ({
  filters,
  onFiltersChange,
  availableServices,
  availableSpecialties,
  maxServicePrice,
}: StylistSearchFiltersProps) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    filters.serviceType,
    filters.minRating > 0,
    filters.maxPrice !== null,
    filters.specialties.length > 0,
  ].filter(Boolean).length;

  const updateFilter = (partial: Partial<StylistFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const toggleSpecialty = (s: string) => {
    const next = filters.specialties.includes(s)
      ? filters.specialties.filter((x) => x !== s)
      : [...filters.specialties, s];
    updateFilter({ specialties: next });
  };

  const clearFilters = () => onFiltersChange(defaultFilters);

  const ratingStars = [3, 3.5, 4, 4.5];

  return (
    <div className="space-y-3">
      {/* Search bar + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("customer.booking.searchPlaceholder", "Search by name or specialty…")}
            value={filters.searchQuery}
            onChange={(e) => updateFilter({ searchQuery: e.target.value })}
            className="pl-9 bg-secondary/50 border-border/30 h-11"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter({ searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-11 w-11 shrink-0 relative",
            showFilters && "bg-primary text-primary-foreground"
          )}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Sort chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {(
          [
            { key: "distance", label: t("customer.booking.sortDistance", "Nearest") },
            { key: "rating", label: t("customer.booking.sortRating", "Top Rated") },
            { key: "price", label: t("customer.booking.sortPrice", "Lowest Price") },
            { key: "reviews", label: t("customer.booking.sortReviews", "Most Reviews") },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => updateFilter({ sortBy: key })}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filters.sortBy === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <Card className="p-4 space-y-5 border-primary/20 bg-card/80 backdrop-blur-sm animate-fade-in">
          {/* Service type */}
          {availableServices.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-primary" />
                {t("customer.booking.filterService", "Service Type")}
              </label>
              <Select
                value={filters.serviceType || "all"}
                onValueChange={(v) => updateFilter({ serviceType: v === "all" ? null : v })}
              >
                <SelectTrigger className="bg-secondary/50 border-border/30">
                  <SelectValue placeholder={t("customer.booking.allServices", "All Services")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("customer.booking.allServices", "All Services")}
                  </SelectItem>
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Min rating */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-warning" />
              {t("customer.booking.filterRating", "Minimum Rating")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter({ minRating: 0 })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filters.minRating === 0
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-secondary/60 text-muted-foreground"
                )}
              >
                {t("customer.booking.anyRating", "Any")}
              </button>
              {ratingStars.map((r) => (
                <button
                  key={r}
                  onClick={() => updateFilter({ minRating: r })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    filters.minRating === r
                      ? "bg-warning/20 text-warning border border-warning/30"
                      : "bg-secondary/60 text-muted-foreground"
                  )}
                >
                  {r}
                  <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Max price */}
          {maxServicePrice > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-accent" />
                  {t("customer.booking.filterPrice", "Max Price")}
                </label>
                <span className="text-xs text-primary font-medium">
                  {filters.maxPrice === null
                    ? t("customer.booking.anyPrice", "Any")
                    : `$${filters.maxPrice}`}
                </span>
              </div>
              <Slider
                value={[filters.maxPrice ?? maxServicePrice]}
                onValueChange={([v]) =>
                  updateFilter({ maxPrice: v >= maxServicePrice ? null : v })
                }
                min={0}
                max={maxServicePrice}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>$0</span>
                <span>${maxServicePrice}+</span>
              </div>
            </div>
          )}

          {/* Specialties */}
          {availableSpecialties.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t("customer.booking.filterSpecialties", "Specialties")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableSpecialties.map((s) => (
                  <Badge
                    key={s}
                    variant={filters.specialties.includes(s) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs transition-all",
                      filters.specialties.includes(s)
                        ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                        : "hover:border-primary/30"
                    )}
                    onClick={() => toggleSpecialty(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t("customer.booking.clearFilters", "Clear all filters")}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
