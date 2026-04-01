import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fallbackHairstyleImage, getHairstyleImage } from "./hairstyleImageMap";

interface HairStyle {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  gender: string;
}

interface HairStyleSelectorProps {
  styles: HairStyle[];
  selectedStyle: string;
  onSelect: (styleName: string) => void;
}

const styleTags: Record<string, string[]> = {
  // Male styles
  "Fade": ["professional", "clean", "classic"],
  "Undercut": ["modern", "edgy", "bold"],
  "Buzz Cut": ["minimal", "low-maintenance", "clean"],
  "Crew Cut": ["classic", "professional", "neat"],
  "Pompadour": ["retro", "voluminous", "stylish"],
  "Quiff": ["modern", "volume", "versatile"],
  "Slick Back": ["elegant", "formal", "polished"],
  "Man Bun": ["trendy", "casual", "long-hair"],
  // Female styles
  "Pixie Cut": ["short", "chic", "easy"],
  "Bob Cut": ["sleek", "elegant", "versatile"],
  "Lob": ["shoulder-length", "modern", "low-maintenance"],
  "Layers": ["volume", "movement", "natural"],
  "Bangs/Fringe": ["face-framing", "trendy", "youthful"],
  "Beach Waves": ["casual", "romantic", "effortless"],
  "Updo": ["formal", "elegant", "special-occasion"],
  // Unisex styles
  "Braids": ["protective", "stylish", "cultural"],
  "Afro": ["natural", "voluminous", "textured"],
  "Dreadlocks": ["cultural", "unique", "bold"],
  "Mohawk": ["edgy", "punk", "statement"],
  "Shag": ["retro", "textured", "rock-n-roll"],
};

export const HairStyleSelector = ({ styles, selectedStyle, onSelect }: HairStyleSelectorProps) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filteredStyles = styles.filter(style => 
    style.name.toLowerCase().includes(search.toLowerCase()) ||
    style.description?.toLowerCase().includes(search.toLowerCase()) ||
    styleTags[style.name]?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const displayStyles = expanded ? filteredStyles : filteredStyles.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search styles (e.g., fade, professional, bold)"
          className="pl-10 h-12 border-2 focus:border-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayStyles.map((style) => {
          const isSelected = selectedStyle === style.name;
          const imageUrl = getHairstyleImage(style.name) || style.image_url || fallbackHairstyleImage;
          const tags = styleTags[style.name] || ["stylish"];

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.name)}
              className={cn(
                "relative rounded-xl overflow-hidden border-2 transition-all text-left group",
                isSelected 
                  ? "border-primary ring-2 ring-primary ring-offset-2" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img 
                  src={imageUrl} 
                  alt={`${style.name} hairstyle reference`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={1024}
                  height={1024}
                  onError={(event) => {
                    event.currentTarget.src = fallbackHairstyleImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3">
                <h3 className="font-semibold text-white text-sm">{style.name}</h3>
                <p className="text-white/80 text-xs line-clamp-1">
                  {style.description || tags.join(" · ")}
                </p>
              </div>

              {/* Tags on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                <span className="text-white font-medium mb-2">{style.name}</span>
                <div className="flex flex-wrap gap-1 justify-center">
                  {tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Show more button */}
      {filteredStyles.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          {expanded ? "Show less" : `Show ${filteredStyles.length - 6} more styles`}
        </button>
      )}

      {filteredStyles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No styles found matching "{search}"
        </div>
      )}
    </div>
  );
};
