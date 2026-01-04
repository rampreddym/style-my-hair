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
  "Fade": ["professional", "clean", "classic"],
  "Undercut": ["modern", "edgy", "bold"],
  "Textured": ["casual", "trendy", "volume"],
  "Pixie": ["short", "chic", "easy"],
  "Bob": ["sleek", "elegant", "versatile"],
  "Layered": ["volume", "movement", "natural"],
  "Braids": ["protective", "stylish", "cultural"],
  "Curly": ["natural", "defined", "bouncy"],
};

const defaultImages: Record<string, string> = {
  "Fade": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "Undercut": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=300&fit=crop",
  "Textured": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&h=300&fit=crop",
  "Pixie": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=300&fit=crop",
  "Bob": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  "Layered": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop",
  "Braids": "https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=300&h=300&fit=crop",
  "Curly": "https://images.unsplash.com/photo-1634038474395-91d2d4c25ab0?w=300&h=300&fit=crop",
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
