import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Clock, DollarSign, ArrowLeft, Calendar, Check, CreditCard } from "lucide-react";

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
    
    // Fetch stylist's services
    const { data: servicesData } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylist.id);

    if (servicesData) setServices(servicesData);
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
          payment_status: "unpaid",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Finding stylists near you...</div>
      </div>
    );
  }

  if (booked && bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
        <div className="max-w-lg mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 space-y-6">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
                <p className="text-muted-foreground mt-2">Your appointment has been scheduled</p>
              </div>
              
              <div className="space-y-4 text-left bg-secondary/50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stylist:</span>
                  <span className="font-medium">{bookingDetails.stylist.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{bookingDetails.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(bookingDetails.appointment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">
                    {new Date(bookingDetails.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${bookingDetails.price}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={() => navigate("/")}>
                  Done
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/customer/style")}>
                  Try Another Style
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
            <h2 className="text-xl font-semibold">Available Stylists</h2>
            {stylists.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No stylists available yet. Check back soon!
                </CardContent>
              </Card>
            ) : (
              stylists.map((stylist) => (
                <Card
                  key={stylist.id}
                  onClick={() => selectStylist(stylist)}
                  className={`cursor-pointer transition-all ${
                    selectedStylist?.id === stylist.id ? "ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {stylist.photo_url ? (
                        <img src={stylist.photo_url} alt={stylist.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {stylist.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{stylist.name}</h3>
                      {stylist.business_name && (
                        <p className="text-sm text-muted-foreground">{stylist.business_name}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          {stylist.rating || "New"}
                        </span>
                        {stylist.distance !== null && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {stylist.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      {stylist.specialties?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {stylist.specialties.slice(0, 3).map((s: string, i: number) => (
                            <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {selectedStylist && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Book with {selectedStylist.name}</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {services.length === 0 ? (
                    <p className="text-muted-foreground">No services configured yet</p>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Select Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{selectedService.name}</span>
                      <span>${selectedService.price}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${selectedService.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Payment will be processed when you confirm the booking
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleBooking}
                disabled={booking || !selectedService || !appointmentDate || !appointmentTime}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {booking ? "Booking..." : "Confirm & Pay"}
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