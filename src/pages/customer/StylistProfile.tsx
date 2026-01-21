import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Award,
  Calendar,
  Briefcase,
  Image
} from "lucide-react";
import { StylistLocationLink } from "@/components/map/StylistLocationLink";
import { MapPreview } from "@/components/map/MapPreview";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { CustomerLayout } from "@/components/layout/CustomerLayout";

const StylistProfile = () => {
  const navigate = useNavigate();
  const { stylistId } = useParams();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stylist, setStylist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!stylistId) {
      navigate("/customer/booking");
      return;
    }
    fetchData();
  }, [stylistId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch stylist details
    const { data: stylistData, error: stylistError } = await supabase
      .from("stylists_public")
      .select("*")
      .eq("id", stylistId)
      .single();

    if (stylistError || !stylistData) {
      navigate("/customer/booking");
      return;
    }
    
    setStylist(stylistData);

    // Fetch services
    const { data: servicesData } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylistId);

    if (servicesData) setServices(servicesData);

    // Fetch portfolio
    const { data: portfolioData } = await supabase
      .from("stylist_portfolio")
      .select("*")
      .eq("stylist_id", stylistId)
      .limit(6);

    if (portfolioData) setPortfolioPhotos(portfolioData);

    // Fetch reviews with customer info
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, customers(name)")
      .eq("stylist_id", stylistId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (reviewsData) setReviews(reviewsData);

    setLoading(false);
  };


  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="page-gradient p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <CardSkeleton count={4} />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!stylist) return null;

  return (
    <CustomerLayout>
      <div className="page-gradient min-h-screen pb-24">
        {/* Header Section */}
        <div className="relative">
          {/* Back Button - Fixed at top */}
          <div className="absolute top-4 left-4 z-20">
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Map or Gradient Header */}
          {stylist.latitude && stylist.longitude ? (
            <MapPreview
              latitude={stylist.latitude}
              longitude={stylist.longitude}
              label={stylist.business_name || stylist.name}
              avatarUrl={stylist.photo_url}
              avatarFallback={stylist.name}
              className="h-[200px] rounded-none"
            />
          ) : (
            <div className="h-[140px] bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
        </div>

        {/* Profile Content - Below the header with slight overlap */}
        <div className="px-4 -mt-6 space-y-4 relative z-10">
          {/* Profile Header Card */}
          <Card variant="elevated" className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex gap-4 items-start">
                {stylist.photo_url ? (
                  <img
                    src={stylist.photo_url}
                    alt={stylist.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-background shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-background shadow-lg flex-shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {stylist.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="text-lg font-bold text-foreground truncate">{stylist.name}</h1>
                  {stylist.business_name && (
                    <p className="text-sm text-muted-foreground truncate">{stylist.business_name}</p>
                  )}
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {stylist.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="font-semibold text-sm">{stylist.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">
                          ({stylist.total_reviews})
                        </span>
                      </div>
                    )}
                    {stylist.years_experience && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3" />
                        <span>{stylist.years_experience} yrs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {stylist.bio && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {stylist.bio}
                </p>
              )}

              {/* Location */}
              {stylist.address && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <StylistLocationLink
                    address={stylist.address}
                    latitude={stylist.latitude}
                    longitude={stylist.longitude}
                    stylistName={stylist.name}
                    variant="inline"
                  />
                </div>
              )}

              {/* Specialties */}
              {stylist.specialties && stylist.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {stylist.specialties.map((specialty: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {stylist.certifications && stylist.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {stylist.certifications.map((cert: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Preview */}
          {portfolioPhotos.length > 0 && (
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  {t('stylist.profile.portfolio')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {portfolioPhotos.map((photo, i) => (
                    <img
                      key={photo.id || i}
                      src={photo.image_url}
                      alt={photo.description || t('stylist.profile.portfolioWork')}
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                {t('stylist.services.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('customer.bookingDetails.noServicesAvailable')}
                </p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{service.name}</span>
                      <span className="font-semibold text-primary">${service.price}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes} {t('customer.bookingDetails.min')}
                      </span>
                      {service.description && (
                        <span className="truncate">{service.description}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  {t('common.reviews')} ({stylist.total_reviews})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {review.customers?.name || t('common.anonymous')}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "text-warning fill-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Book Now Button */}
          <Button
            onClick={() => navigate(`/customer/booking/${stylistId}`)}
            className="w-full h-14 rounded-xl text-base font-medium shadow-glow-primary"
          >
            <Calendar className="w-5 h-5 mr-2" />
            {t('customer.booking.bookNow')}
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default StylistProfile;
