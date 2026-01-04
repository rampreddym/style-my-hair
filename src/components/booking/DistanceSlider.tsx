import { Slider } from "@/components/ui/slider";
import { MapPin } from "lucide-react";

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
  maxDistance?: number;
}

export const DistanceSlider = ({ value, onChange, maxDistance = 50 }: DistanceSliderProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Max Distance</span>
        </div>
        <span className="text-sm text-primary font-medium">
          {value === maxDistance ? "Any" : `${value} km`}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={1}
        max={maxDistance}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1 km</span>
        <span>Any distance</span>
      </div>
    </div>
  );
};
