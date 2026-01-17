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
  const [selectedStylist, setSelectedStylist] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch customer ID from auth
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) return;
      
      const { data: customerData } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (customerData) {
        setCustomerId(customerData.id);
      } else {
        navigate("/customer");
      }
    };
    
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchCustomerId();
      }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const fetchData = async () => {
    if (!customerId) return;
    
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

    // Fetch stylists from public view (excludes sensitive data like email, phone, stripe_account_id)
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
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleStylistSelect = (stylist: any) => {
    setSelectedStylist(stylist);
    setIsSheetOpen(true);
  };

  const selectStylist = (stylist: any) => {
    navigate(`/customer/booking/${stylist.id}`);
  };

  const filteredStylists = stylists.filter(s =>
    s.distance === null || s.distance === undefined || s.distance <= maxDistance
  );

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="page-gradient p-4">
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
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
      <div className="page-gradient p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6 pt-2">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t('customer.booking.title')}</h1>
            <p className="text-muted-foreground">{t('customer.booking.selectStylistSubtitle')}</p>
          </div>

          {selectedStyle && (
            <Card variant="accent" className="card-shine">
              <CardContent className="p-4 flex gap-4 items-center relative z-10">
                <img
                  src={selectedStyle.generated_image_url}
                  alt={t('customer.booking.selectedStyle')}
                  className="w-16 h-16 rounded-xl object-cover shadow-soft ring-2 ring-primary/20"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t('customer.booking.yourSelectedStyle')}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{selectedStyle.style_prompt}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distance Slider */}
          <Card variant="default" className="p-4 shadow-card">
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
                  onSelect={() => handleStylistSelect(stylist)}
                />
              ))}
            </div>
          )}

          {/* Stylist Profile Sheet */}
          <StylistProfileSheet
            stylist={selectedStylist}
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            onNewAppointment={() => selectedStylist && selectStylist(selectedStylist)}
            onViewHistory={() => navigate("/customer/appointments")}
            onMessage={() => {
              toast({
                title: "Coming soon",
                description: "Messaging feature is under development",
              });
            }}
            onCall={() => {
              toast({
                title: "Coming soon", 
                description: "Call feature is under development",
              });
            }}
          />
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerBooking;
