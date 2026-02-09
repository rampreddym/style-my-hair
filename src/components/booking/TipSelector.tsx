import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { useState } from "react";

interface TipSelectorProps {
  serviceTotal: number;
  onTipChange: (tip: number) => void;
  tip: number;
}

const TIP_PERCENTAGES = [15, 20, 25];

export const TipSelector = ({ serviceTotal, onTipChange, tip }: TipSelectorProps) => {
  const [customTip, setCustomTip] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);

  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage);
    setCustomTip("");
    const tipAmount = Math.round((serviceTotal * percentage) / 100 * 100) / 100;
    onTipChange(tipAmount);
  };

  const handleCustomTip = (value: string) => {
    setSelectedPercentage(null);
    setCustomTip(value);
    const tipAmount = parseFloat(value) || 0;
    onTipChange(tipAmount);
  };

  const handleNoTip = () => {
    setSelectedPercentage(null);
    setCustomTip("");
    onTipChange(0);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-base font-medium">
        <Heart className="w-4 h-4 text-pink-500" />
        Add a tip for your stylist
      </Label>
      
      <div className="flex gap-2">
        {TIP_PERCENTAGES.map((percentage) => {
          const tipAmount = Math.round((serviceTotal * percentage) / 100 * 100) / 100;
          return (
            <Button
              key={percentage}
              type="button"
              variant={selectedPercentage === percentage ? "default" : "outline"}
              className="flex-1 flex-col h-auto py-2"
              onClick={() => handlePercentageSelect(percentage)}
            >
              <span className="text-sm font-semibold">{percentage}%</span>
              <span className="text-xs opacity-70">${tipAmount.toFixed(2)}</span>
            </Button>
          );
        })}
        <Button
          type="button"
          variant={tip === 0 && !customTip && selectedPercentage === null ? "default" : "outline"}
          className="flex-1 py-2"
          onClick={handleNoTip}
        >
          <span className="text-sm">No tip</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Custom:</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            placeholder="0.00"
            className="pl-7"
          />
        </div>
      </div>

      {tip > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Your tip: <span className="text-primary font-medium">${tip.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
};
