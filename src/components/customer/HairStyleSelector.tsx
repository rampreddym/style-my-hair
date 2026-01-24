import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

const defaultImages: Record<string, string> = {
  // Male styles - men's reference images
  "Fade": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop",
  "Undercut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop",
  "Buzz Cut": "https://images.unsplash.com/photo-1520341280432-4749d4d7bcf9?w=300&h=300&fit=crop",
  "Crew Cut": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&fit=crop",
  "Pompadour": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop",
  "Quiff": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
  "Slick Back": "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=300&h=300&fit=crop",
  "Man Bun": "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=300&fit=crop",
  // Female styles - women's reference images
  "Pixie Cut": "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=300&h=300&fit=crop",
  "Bob Cut": "https://images.unsplash.com/photo-1554519515-242161756769?w=300&h=300&fit=crop",
  "Lob": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&h=300&fit=crop",
  "Layers": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop",
  "Bangs/Fringe": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop",
  "Beach Waves": "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300&h=300&fit=crop",
  "Updo": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop",
  // Unisex styles - varied reference images
  "Braids": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop",
  "Afro": "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=300&h=300&fit=crop",
  "Dreadlocks": "https://images.unsplash.com/photo-1507152927528-56b99d4a4fe5?w=300&h=300&fit=crop",
  "Mohawk": "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=300&h=300&fit=crop",
  "Shag": "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=300&h=300&fit=crop",
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
          const imageUrl = style.image_url || defaultImages[style.name] || 
            `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop`;
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
                  alt={style.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
