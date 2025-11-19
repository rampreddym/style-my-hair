import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StylistStepProps {
  selectedStylist: any;
  onSelect: (stylist: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const StylistStep = ({ selectedStylist, onSelect, onNext, onBack }: StylistStepProps) => {
  const [stylists, setStylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setStylists(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading stylists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Finding the best stylists for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Stylist</h2>
        <p className="text-muted-foreground">Choose a professional to bring your vision to life</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {stylists.map((stylist) => (
            <button
              key={stylist.id}
              onClick={() => onSelect(stylist)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedStylist?.id === stylist.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex gap-4">
                <img
                  src={stylist.photo_url}
                  alt={stylist.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{stylist.name}</h3>
                    {selectedStylist?.id === stylist.id && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{stylist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium">{stylist.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stylist.specialties?.slice(0, 3).map((specialty: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
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
            disabled={!selectedStylist}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StylistStep;
