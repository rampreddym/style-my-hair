import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { DistanceSlider } from "@/components/booking/DistanceSlider";
import { EnhancedStylistCard } from "@/components/stylist/EnhancedStylistCard";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { StylistProfileSheet } from "@/components/stylist/StylistProfileSheet";
import { SmartBookingSuggestionDialog } from "@/components/booking/SmartBookingSuggestionDialog";
import { useSmartBookingSuggestion } from "@/hooks/useSmartBookingSuggestion";
import { Search, MapPin, Sparkles } from "lucide-react";

const CustomerBooking = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stylists, setStylists] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [maxDistance, setMaxDistance] = useState(50);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [selectedStylist, setSelectedStylist] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showSmartSuggestion, setShowSmartSuggestion] = useState(false);
  const [hasShownSuggestion, setHasShownSuggestion] = useState(false);

  const {
    lastBooking,
    aiRecommendations,
    loading: smartSuggestionLoading,
    showSuggestion,
    setShowSuggestion,
    getBestRecommendation,
  } = useSmartBookingSuggestion({
    customerId,
    selectedServiceName: selectedStyle?.style_prompt?.split(' ')[0] || null,
    customerLatitude: customerLocation.latitude,
    customerLongitude: customerLocation.longitude,
  });

  useEffect(() => {
    if (!hasShownSuggestion && showSuggestion && (lastBooking || aiRecommendations.length > 0)) {
      setShowSmartSuggestion(true);
      setHasShownSuggestion(true);
      setShowSuggestion(false);
    }
  }, [showSuggestion, lastBooking, aiRecommendations, hasShownSuggestion, setShowSuggestion]);

  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) return;
      const { data: customerData } = await supabase
        .from("customers")
        .select("id, latitude, longitude")
        .eq("user_id", user.id)
        .maybeSingle();
      if (customerData) {
        setCustomerId(customerData.id);
        setCustomerLocation({ latitude: customerData.latitude, longitude: customerData.longitude });
      } else {
        navigate("/customer");
      }
    };
    if (!authLoading) {
      if (!user) navigate("/auth");
      else fetchCustomerId();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (customerId) fetchData();
  }, [customerId]);

  const fetchData = async () => {
    if (!customerId) return;
    setLoading(true);

    const { data: styleData } = await supabase
      .from("customer_generated_styles")
      .select("*")
      .eq("customer_id", customerId)
      .eq("selected", true)
      .maybeSingle();
    if (styleData) setSelectedStyle(styleData);

    const { data: customer } = await supabase
      .from("customers")
      .select("latitude, longitude")
      .eq("id", customerId)
      .single();

    const { data: stylistsData } = await supabase
      .from("stylists_public")
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
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleStylistSelect = (stylist: any) => {
    setSelectedStylist(stylist);
    setIsSheetOpen(true);
  };

  const selectStylist = (stylist: any) => {
    navigate(`/customer/booking/${stylist.id}`);
  };

  const handleSmartSelectStylist = (stylistId: string) => {
    setShowSmartSuggestion(false);
    navigate(`/customer/booking/${stylistId}`);
  };

  const handleAutoSelect = () => {
    const best = getBestRecommendation();
    if (best) {
      setShowSmartSuggestion(false);
      navigate(`/customer/booking/${best.id}`);
      toast({
        title: t("booking.smartSuggestion.title"),
        description: `${t("booking.smartSuggestion.bestMatch")}: ${best.name}`,
      });
    }
  };

  const filteredStylists = stylists.filter(s =>
    s.distance === null || s.distance === undefined || s.distance <= maxDistance
  );

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="page-radial p-4">
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{t('customer.booking.title')}</h1>
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
      <div className="page-radial p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-5 pt-2">
          {/* Hero Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t('customer.booking.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('customer.booking.selectStylistSubtitle')}</p>
          </div>

          {/* Selected Style Preview */}
          {selectedStyle && (
            <Card className="border border-primary/20 bg-gradient-hero card-shine overflow-hidden">
              <CardContent className="p-4 flex gap-4 items-center relative z-10">
                <img
                  src={selectedStyle.generated_image_url}
                  alt={t('customer.booking.selectedStyle')}
                  className="w-16 h-16 rounded-xl object-cover shadow-glow-primary ring-2 ring-primary/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {t('customer.booking.yourSelectedStyle')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{selectedStyle.style_prompt}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distance Filter */}
          <Card className="p-4 shadow-card border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{t('customer.booking.searchRadius', 'Search Radius')}</span>
            </div>
            <DistanceSlider value={maxDistance} onChange={setMaxDistance} maxDistance={50} />
          </Card>

          {/* Stylists Count */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t('customer.booking.availableStylists')}</h2>
            <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-secondary/50">
              {t('customer.booking.stylistsFound', { count: filteredStylists.length })}
            </span>
          </div>

          {/* Empty State */}
          {filteredStylists.length === 0 ? (
            <Card className="border-dashed border-2 border-accent/20">
              <CardContent className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Search className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('customer.booking.noStylistsInRange', { distance: maxDistance })}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('customer.booking.tryIncreasing')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStylists.map((stylist, index) => (
                <div key={stylist.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <EnhancedStylistCard
                    stylist={stylist}
                    isSelected={false}
                    onSelect={() => handleStylistSelect(stylist)}
                  />
                </div>
              ))}
            </div>
          )}

          <StylistProfileSheet
            stylist={selectedStylist}
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            onNewAppointment={() => selectedStylist && selectStylist(selectedStylist)}
            onViewHistory={() => navigate("/customer/appointments")}
            onViewProfile={() => selectedStylist && navigate(`/customer/stylist/${selectedStylist.id}`)}
            onMessage={() => selectedStylist && navigate(`/customer/stylist/${selectedStylist.id}`, { state: { openMessaging: true } })}
            onCall={() => {
              if (selectedStylist?.phone) {
                window.location.href = `tel:${selectedStylist.phone}`;
              } else {
                toast({
                  title: t('messaging.noPhoneAvailable', 'Phone not available'),
                  description: t('messaging.useMessaging', 'Please use messaging to contact this stylist'),
                });
              }
            }}
          />

          <SmartBookingSuggestionDialog
            open={showSmartSuggestion}
            onOpenChange={setShowSmartSuggestion}
            serviceName={selectedStyle?.style_prompt || t('booking.service')}
            lastBooking={lastBooking}
            aiRecommendations={aiRecommendations}
            loading={smartSuggestionLoading}
            onSelectStylist={handleSmartSelectStylist}
            onAutoSelect={handleAutoSelect}
          />
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerBooking;