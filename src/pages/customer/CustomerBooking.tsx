import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Clock, ArrowLeft, Calendar, Image } from "lucide-react";
import { EnhancedStylistCard } from "@/components/stylist/EnhancedStylistCard";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { PaymentTimingSelector, PaymentTiming } from "@/components/booking/PaymentTimingSelector";
import { DistanceSlider } from "@/components/booking/DistanceSlider";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";

const CustomerBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [stylists, setStylists] = useState<any[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [booked, setBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("pay_now");
  const [maxDistance, setMaxDistance] = useState(50);
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);

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

    // Fetch stylists (for now, fetch all - in production would filter by distance)
    const { data: stylistsData } = await supabase
      .from("stylists")
      .select("*")
      .order("rating", { ascending: false });

    if (stylistsData) {
      // Calculate distance if customer has location
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
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const selectStylist = async (stylist: any) => {
    setSelectedStylist(stylist);
    setSelectedService(null);
    setAppointmentDate("");
    setAppointmentTime("");
    
    // Fetch stylist's services
    const { data: servicesData } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylist.id);

    if (servicesData) setServices(servicesData);
    
    // Fetch portfolio photos
    const { data: portfolioData } = await supabase
      .from("stylist_portfolio")
      .select("*")
      .eq("stylist_id", stylist.id);
      
    if (portfolioData) setPortfolioPhotos(portfolioData);
  };

  // Filter stylists by distance
  const filteredStylists = stylists.filter(s => 
    s.distance === null || s.distance === undefined || s.distance <= maxDistance
  );

  const handleSlotSelect = (date: string, time: string) => {
    setAppointmentDate(date);
    setAppointmentTime(time);
  };

  const handleBooking = async () => {
    if (!selectedService || !appointmentDate || !appointmentTime) {
      toast({ title: "Please complete all fields", variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          customer_id: customerId,
          stylist_id: selectedStylist.id,
          service_id: selectedService.id,
          generated_style_id: selectedStyle?.id,
          appointment_date: appointmentDateTime,
          price: selectedService.price,
          status: "pending",
          payment_status: paymentTiming === "pay_now" ? "pending" : "pay_later",
          ai_style_description: selectedStyle?.style_prompt,
        })
        .select()
        .single();

      if (error) throw error;

      setBookingDetails({
        ...appointment,
        stylist: selectedStylist,
        service: selectedService,
      });
      setBooked(true);
      toast({ title: "Booking confirmed!", description: "Your appointment has been scheduled" });
    } catch (error: any) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Book Your Appointment</h1>
            <p className="text-muted-foreground">Finding stylists near you...</p>
          </div>
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (booked && bookingDetails) {
    return (
      <BookingConfirmation
        booking={{
          id: bookingDetails.id,
          appointment_date: bookingDetails.appointment_date,
          price: bookingDetails.price,
          stylist: bookingDetails.stylist,
          service: bookingDetails.service,
        }}
        onDone={() => navigate("/")}
        onTryAnotherStyle={() => navigate("/customer/style")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Book Your Appointment</h1>
          <p className="text-muted-foreground">Find the perfect stylist near you</p>
        </div>

        {selectedStyle && (
          <Card>
            <CardHeader>
              <CardTitle>Your Selected Style</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 items-center">
              <img
                src={selectedStyle.generated_image_url}
                alt="Selected style"
                className="w-24 h-24 rounded-lg object-cover"
              />
              <p className="text-muted-foreground">{selectedStyle.style_prompt}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available Stylists</h2>
              <span className="text-sm text-muted-foreground">
                {filteredStylists.length} found
              </span>
            </div>
            
            {/* Distance Slider */}
            <Card className="p-4">
              <DistanceSlider value={maxDistance} onChange={setMaxDistance} maxDistance={50} />
            </Card>
            
            {filteredStylists.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No stylists within {maxDistance} km. Try increasing the distance.
                </CardContent>
              </Card>
            ) : (
              filteredStylists.map((stylist) => (
                <EnhancedStylistCard
                  key={stylist.id}
                  stylist={stylist}
                  isSelected={selectedStylist?.id === stylist.id}
                  onSelect={() => selectStylist(stylist)}
                  recentWork={portfolioPhotos.filter(p => p.stylist_id === stylist.id).map(p => p.image_url).slice(0, 4)}
                />
              ))
            )}
          </div>

          {selectedStylist && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Book with {selectedStylist.name}</h2>
                {/* Portfolio preview */}
                {portfolioPhotos.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Image className="w-4 h-4 mr-1" />
                        Portfolio ({portfolioPhotos.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedStylist.name}'s Portfolio</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioPhotos.map((photo, i) => (
                          <img
                            key={photo.id || i}
                            src={photo.image_url}
                            alt="Portfolio work"
                            className="aspect-square rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Step 1: Select Service */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                    Select Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {services.length === 0 ? (
                    <p className="text-muted-foreground">No services configured yet</p>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setAppointmentDate("");
                          setAppointmentTime("");
                        }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedService?.id === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{service.name}</span>
                          <span className="font-semibold text-primary">${service.price}</span>
                        </div>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Select Time Slot (only after service is selected) */}
              {selectedService && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
                    <span className="font-medium">Choose Time Slot</span>
                  </div>
                  <TimeSlotPicker
                    stylistId={selectedStylist.id}
                    serviceDuration={selectedService.duration_minutes}
                    onSlotSelect={handleSlotSelect}
                    selectedDate={appointmentDate}
                    selectedTime={appointmentTime}
                  />
                </div>
              )}

              {selectedService && appointmentDate && appointmentTime && (
                <>
                  <PaymentTimingSelector
                    value={paymentTiming}
                    onChange={setPaymentTiming}
                    servicePrice={selectedService.price}
                  />

                  <PriceBreakdown 
                    service={selectedService}
                    platformFeePercent={0}
                    paymentTiming={paymentTiming}
                  />
                </>
              )}

              <Button
                onClick={handleBooking}
                disabled={booking || !selectedService || !appointmentDate || !appointmentTime}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {booking ? "Booking..." : paymentTiming === "pay_now" ? "Confirm & Pay" : "Confirm Booking"}
              </Button>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={() => navigate("/customer/style")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Style Selection
        </Button>
      </div>
    </div>
  );
};

export default CustomerBooking;