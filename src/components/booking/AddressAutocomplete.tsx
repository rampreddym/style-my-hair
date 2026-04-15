import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Prediction {
  place_id: string;
  description: string;
  main_text?: string;
  secondary_text?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  }) => void;
  placeholder?: string;
  id?: string;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing your salon address...",
  id = "address",
}: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (input.trim().length < 3) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("autocomplete-address", {
          body: { input, sessionToken },
        });
        if (error) throw error;
        setPredictions(data?.predictions || []);
        setShowDropdown((data?.predictions || []).length > 0);
      } catch (err) {
        console.error("Autocomplete error:", err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    },
    [sessionToken]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = async (prediction: Prediction) => {
    setShowDropdown(false);
    onChange(prediction.description);

    try {
      const { data, error } = await supabase.functions.invoke("get-place-details", {
        body: { placeId: prediction.place_id, sessionToken },
      });
      if (error) throw error;

      if (data) {
        onChange(data.formatted_address || prediction.description);
        onPlaceSelect?.({
          address: data.formatted_address || prediction.description,
          lat: data.lat,
          lng: data.lng,
          placeId: prediction.place_id,
        });
      }
    } catch (err) {
      console.error("Place details error:", err);
      // Still use the prediction description as fallback
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full px-3 py-3 text-left hover:bg-accent/10 transition-colors flex items-start gap-2 border-b border-border/50 last:border-b-0"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.main_text || p.description}</p>
                {p.secondary_text && (
                  <p className="text-xs text-muted-foreground truncate">{p.secondary_text}</p>
                )}
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-right">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
};
