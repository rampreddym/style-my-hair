import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ResultsStepProps {
  images: string[];
  selectedImage: string;
  onSelect: (image: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ResultsStep = ({ images, selectedImage, onSelect, onNext, onBack }: ResultsStepProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Favorite</h2>
        <p className="text-muted-foreground">Select the style you'd like to get</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onSelect(image)}
              className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                selectedImage === image
                  ? "ring-4 ring-primary shadow-lg scale-105"
                  : "hover:scale-102"
              }`}
            >
              <img
                src={image}
                alt={`Style option ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedImage === image && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 rounded-xl h-12"
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedImage}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Find Stylists
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;
