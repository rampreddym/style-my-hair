import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { DistanceSlider } from "@/components/booking/DistanceSlider";
import { EnhancedStylistCard } from "@/components/stylist/EnhancedStylistCard";
import { CustomerLayout } from "@/components/layout/CustomerLayout";

const CustomerBooking = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stylists, setStylists] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [maxDistance, setMaxDistance] = useState(50);

  const customerId = sessionStorage.getItem("customerId");

  useEffect(() => {
    if (!customerId) {
      navigate("/customer");
      return;
    }
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch selected style
    const { data: styleData } = await supabase
      .from("customer_generated_styles")
      .select("*")
      .eq("customer_id", customerId)
      .eq("selected", true)
      .maybeSingle();

    if (styleData) setSelectedStyle(styleData);

    // Fetch customer location
    const { data: customer } = await supabase
      .from("customers")
      .select("latitude, longitude")
      .eq("id", customerId)
      .single();

    // Fetch stylists
    const { data: stylistsData } = await supabase
      .from("stylists")
      .select("*")
      .order("rating", { ascending: false });

    if (stylistsData) {
      if (customer?.latitude && customer?.longitude) {
        const withDistance = stylistsData.map((s) => ({
          ...s,
          distance: s.latitude && s.longitude
            ? calculateDistance(customer.latitude, customer.longitude, s.latitude, s.longitude)
            : null,
        }));
        setStylists(withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)));
      } else {
        setStylists(stylistsData);
      }
    }

    setLoading(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const selectStylist = (stylist: any) => {
    navigate(`/customer/booking/${stylist.id}`);
  };

  const filteredStylists = stylists.filter(s => 
    s.distance === null || s.distance === undefined || s.distance <= maxDistance
  );

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">{t('customer.booking.title')}</h1>
              <p className="text-muted-foreground">{t('customer.booking.findingStylists')}</p>
            </div>
            <CardSkeleton count={3} />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{t('customer.booking.title')}</h1>
            <p className="text-muted-foreground">{t('customer.booking.selectStylistSubtitle')}</p>
          </div>

          {selectedStyle && (
            <Card>
              <CardContent className="p-4 flex gap-4 items-center">
                <img
                  src={selectedStyle.generated_image_url}
                  alt={t('customer.booking.selectedStyle')}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('customer.booking.yourSelectedStyle')}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedStyle.style_prompt}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distance Slider */}
          <Card className="p-4">
            <DistanceSlider value={maxDistance} onChange={setMaxDistance} maxDistance={50} />
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('customer.booking.availableStylists')}</h2>
            <span className="text-sm text-muted-foreground">
              {t('customer.booking.stylistsFound', { count: filteredStylists.length })}
            </span>
          </div>

          {filteredStylists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('customer.booking.noStylistsInRange', { distance: maxDistance })}. {t('customer.booking.tryIncreasing')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStylists.map((stylist) => (
                <EnhancedStylistCard
                  key={stylist.id}
                  stylist={stylist}
                  isSelected={false}
                  onSelect={() => selectStylist(stylist)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerBooking;