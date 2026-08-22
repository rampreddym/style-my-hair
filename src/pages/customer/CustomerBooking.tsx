import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { DistanceSlider } from "@/components/booking/DistanceSlider";
import { StylistSearchFilters, defaultFilters, type StylistFilters } from "@/components/booking/StylistSearchFilters";
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
  const [filters, setFilters] = useState<StylistFilters>(defaultFilters);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [stylistServices, setStylistServices] = useState<Record<string, any[]>>({});

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

    const [styleRes, customerRes, stylistsRes, servicesRes] = await Promise.all([
      supabase.from("customer_generated_styles").select("*").eq("customer_id", customerId).eq("selected", true).maybeSingle(),
      supabase.from("customers").select("latitude, longitude").eq("id", customerId).single(),
      supabase.from("stylists_public").select("*").order("rating", { ascending: false }),
      supabase.from("stylist_services").select("*"),
    ]);

    if (styleRes.data) setSelectedStyle(styleRes.data);

    // Build stylist→services map
    const svcMap: Record<string, any[]> = {};
    if (servicesRes.data) {
      for (const svc of servicesRes.data) {
        if (!svcMap[svc.stylist_id]) svcMap[svc.stylist_id] = [];
        svcMap[svc.stylist_id].push(svc);
      }
    }
    setStylistServices(svcMap);
    setAllServices(servicesRes.data || []);

    if (stylistsRes.data) {
      const customer = customerRes.data;
      if (customer?.latitude && customer?.longitude) {
        const withDistance = stylistsRes.data.map((s) => ({
          ...s,
          distance: s.latitude && s.longitude
            ? calculateDistance(customer.latitude, customer.longitude, s.latitude, s.longitude)
            : null,
        }));
        setStylists(withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)));
      } else {
        setStylists(stylistsRes.data);
      }
    }
    setLoading(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Derived data for filters
  const uniqueServices = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; price: number }>();
    allServices.forEach((s) => {
      if (!seen.has(s.name)) seen.set(s.name, { id: s.id, name: s.name, price: s.price });
    });
    return Array.from(seen.values());
  }, [allServices]);

  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    stylists.forEach((s) => s.specialties?.forEach((sp: string) => set.add(sp)));
    return Array.from(set).sort();
  }, [stylists]);

  const maxServicePrice = useMemo(() => {
    if (allServices.length === 0) return 200;
    return Math.ceil(Math.max(...allServices.map((s) => s.price)) / 5) * 5;
  }, [allServices]);

  // Apply all filters + sorting
  const filteredStylists = useMemo(() => {
    let list = stylists.filter((s) =>
      s.distance === null || s.distance === undefined || s.distance <= maxDistance
    );

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.business_name?.toLowerCase().includes(q) ||
        s.specialties?.some((sp: string) => sp.toLowerCase().includes(q))
      );
    }

    // Min rating
    if (filters.minRating > 0) {
      list = list.filter((s) => (s.rating ?? 0) >= filters.minRating);
    }

    // Service type
    if (filters.serviceType) {
      const stylistIdsWithService = new Set(
        allServices.filter((svc) => svc.name === filters.serviceType).map((svc) => svc.stylist_id)
      );
      list = list.filter((s) => stylistIdsWithService.has(s.id));
    }

    // Max price
    if (filters.maxPrice !== null) {
      const stylistIdsInBudget = new Set<string>();
      for (const [sid, svcs] of Object.entries(stylistServices)) {
        if (svcs.some((svc) => svc.price <= filters.maxPrice!)) {
          stylistIdsInBudget.add(sid);
        }
      }
      list = list.filter((s) => stylistIdsInBudget.has(s.id));
    }

    // Specialties
    if (filters.specialties.length > 0) {
      list = list.filter((s) =>
        filters.specialties.every((sp) => s.specialties?.includes(sp))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "rating":
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "reviews":
        list.sort((a, b) => (b.total_reviews ?? 0) - (a.total_reviews ?? 0));
        break;
      case "price": {
        const minPrice = (id: string) => {
          const svcs = stylistServices[id];
          if (!svcs || svcs.length === 0) return Infinity;
          return Math.min(...svcs.map((s) => s.price));
        };
        list.sort((a, b) => minPrice(a.id) - minPrice(b.id));
        break;
      }
      default: // distance
        list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return list;
  }, [stylists, maxDistance, filters, allServices, stylistServices]);

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

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="page-radial p-4">
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            <div className="space-y-1">
              <h1 className="font-display text-3xl text-foreground">{t('customer.booking.title')}</h1>
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
          <div className="space-y-1">
            <h1 className="font-display text-3xl text-foreground">{t('customer.booking.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('customer.booking.selectStylistSubtitle')}</p>
          </div>

          {/* Selected Style Preview */}
          {selectedStyle && (
            <Card className="border border-primary/20 bg-gradient-hero overflow-hidden">
              <CardContent className="p-4 flex gap-4 items-center relative z-10">
                <img
                  src={selectedStyle.generated_image_url}
                  alt={t('customer.booking.selectedStyle')}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/30"
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

          {/* Search & Filters */}
          <StylistSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableServices={uniqueServices}
            availableSpecialties={availableSpecialties}
            maxServicePrice={maxServicePrice}
          />

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
                    services={stylistServices[stylist.id] || []}
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
