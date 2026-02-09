import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Image, Star } from "lucide-react";
import { StylistLocationLink } from "@/components/map/StylistLocationLink";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { PaymentTimingSelector, PaymentTiming } from "@/components/booking/PaymentTimingSelector";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { CancelAppointmentDialog } from "@/components/booking/CancelAppointmentDialog";
import { RescheduleDialog } from "@/components/booking/RescheduleDialog";
import { ServiceCart } from "@/components/booking/ServiceCart";
import { TipSelector } from "@/components/booking/TipSelector";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

const CustomerBookingDetails = () => {
  const navigate = useNavigate();
  const { stylistId } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [stylist, setStylist] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [booked, setBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("pay_now");
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [tip, setTip] = useState(0);

  // Fetch customer ID and location from auth
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;
      
      const { data: customerData } = await supabase
        .from("customers")
        .select("id, latitude, longitude")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (customerData) {
        setCustomerId(customerData.id);
        setCustomerLocation({
          latitude: customerData.latitude,
          longitude: customerData.longitude,
        });
      } else {
        navigate("/customer");
      }
    };
    
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchCustomerData();
      }
    }
  }, [user, authLoading, navigate]);

  // Primary service reference for calculations
  const primaryService = selectedServices[0];

  useEffect(() => {
    if (!stylistId) {
      navigate("/customer/booking");
      return;
    }
    if (customerId) {
      fetchData();
    }
  }, [customerId, stylistId]);

  // Calculate totals for multi-service
  const serviceTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  const handleAddService = (service: Service) => {
    setSelectedServices([...selectedServices, service]);
    // Reset time slot when services change
    setAppointmentDate("");
    setAppointmentTime("");
  };

  const handleRemoveService = (serviceId: string) => {
    const index = selectedServices.findIndex((s) => s.id === serviceId);
    if (index !== -1) {
      const newServices = [...selectedServices];
      newServices.splice(index, 1);
      setSelectedServices(newServices);
      // Reset time slot when services change
      setAppointmentDate("");
      setAppointmentTime("");
    }
  };

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

    // Fetch stylist details from public view (excludes sensitive data)
    const { data: stylistData, error: stylistError } = await supabase
      .from("stylists_public")
      .select("*")
      .eq("id", stylistId)
      .single();

    if (stylistError || !stylistData) {
      toast({ title: t('customer.bookingDetails.stylistNotFound'), variant: "destructive" });
      navigate("/customer/booking");
      return;
    }
    
    setStylist(stylistData);

    // Fetch stylist's services
    const { data: servicesData } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylistId);

    if (servicesData) setServices(servicesData);

    // Fetch portfolio photos
    const { data: portfolioData } = await supabase
      .from("stylist_portfolio")
      .select("*")
      .eq("stylist_id", stylistId);

    if (portfolioData) setPortfolioPhotos(portfolioData);

    setLoading(false);
  };

  const handleSlotSelect = (date: string, time: string) => {
    setAppointmentDate(date);
    setAppointmentTime(time);
  };

  const handleBooking = async () => {
    if (selectedServices.length === 0 || !appointmentDate || !appointmentTime || !customerId) {
      toast({ title: t('customer.bookingDetails.completeAllFields'), variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
      const primaryService = selectedServices[0];
      const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
      
      // Create appointment with primary service (multi-service support can be extended)
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          customer_id: customerId,
          stylist_id: stylist.id,
          service_id: primaryService.id,
          generated_style_id: selectedStyle?.id,
          appointment_date: appointmentDateTime,
          price: totalPrice,
          tip_amount: tip,
          status: "pending",
          payment_status: paymentTiming === "pay_now" ? "pending" : "pay_later",
          ai_style_description: selectedStyle?.style_prompt,
          stylist_notes: selectedServices.length > 1 
            ? `Services: ${selectedServices.map(s => s.name).join(", ")}` 
            : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch customer and stylist phone numbers for SMS
      const [customerResult, stylistResult] = await Promise.all([
        supabase.from("customers").select("name, phone").eq("id", customerId).single(),
        supabase.from("stylists").select("name, phone").eq("id", stylist.id).single(),
      ]);

      // Send SMS notifications (fire and forget - don't block booking confirmation)
      const serviceNames = selectedServices.map(s => s.name).join(", ");
      supabase.functions.invoke("send-booking-sms", {
        body: {
          appointmentId: appointment.id,
          customerPhone: customerResult.data?.phone || "",
          customerName: customerResult.data?.name || "Customer",
          stylistPhone: stylistResult.data?.phone || "",
          stylistName: stylistResult.data?.name || stylist.name,
          serviceName: serviceNames,
          appointmentDate: appointmentDateTime,
          price: totalPrice + tip,
        },
      }).then((result) => {
        if (result.data?.success) {
          console.log("SMS notifications sent:", result.data);
        } else {
          console.log("SMS notification result:", result.data);
        }
      }).catch((err) => {
        console.error("SMS notification error:", err);
      });

      setBookingDetails({
        ...appointment,
        stylist: stylist,
        service: primaryService,
        services: selectedServices,
        tip_amount: tip,
      });
      setBooked(true);
      toast({ title: t('booking.bookingConfirmed'), description: t('customer.bookingDetails.appointmentScheduled') });
    } catch (error: any) {
      toast({ title: t('customer.bookingDetails.bookingFailed'), description: error.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/customer/booking")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <CardSkeleton count={3} />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (booked && bookingDetails) {
    return (
      <CustomerLayout>
        <BookingConfirmation
          booking={{
            id: bookingDetails.id,
            appointment_date: bookingDetails.appointment_date,
            price: bookingDetails.price,
            stylist: bookingDetails.stylist,
            service: bookingDetails.service,
          }}
          onDone={() => navigate("/customer/appointments")}
          onTryAnotherStyle={() => navigate("/customer/style")}
          onCancel={() => setShowCancelDialog(true)}
          onReschedule={() => setShowRescheduleDialog(true)}
        />

        <CancelAppointmentDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          appointmentId={bookingDetails.id}
          appointmentDate={bookingDetails.appointment_date}
          stylistName={bookingDetails.stylist.name}
          onCancelled={() => navigate("/customer/appointments")}
        />

        <RescheduleDialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
          appointmentId={bookingDetails.id}
          stylistId={stylist.id}
          stylistName={bookingDetails.stylist.name}
          serviceDuration={bookingDetails.service.duration_minutes}
          currentDate={bookingDetails.appointment_date}
          onRescheduled={() => navigate("/customer/appointments")}
        />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/customer/booking")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('customer.bookingDetails.backToStylists')}
          </Button>

          {/* Stylist Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                {stylist.photo_url ? (
                  <img
                    src={stylist.photo_url}
                    alt={stylist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {stylist.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl font-bold">{stylist.name}</h1>
                  {stylist.business_name && (
                    <p className="text-sm text-muted-foreground">{stylist.business_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {stylist.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {stylist.rating.toFixed(1)}
                      </span>
                    )}
                    {(stylist.address || stylist.latitude) && (
                      <StylistLocationLink
                        address={stylist.address}
                        latitude={stylist.latitude}
                        longitude={stylist.longitude}
                        stylistName={stylist.name}
                        variant="inline"
                      />
                    )}
                  </div>
                </div>
                {portfolioPhotos.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Image className="w-4 h-4 mr-1" />
                        {portfolioPhotos.length}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('customer.bookingDetails.portfolio', { name: stylist.name })}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioPhotos.map((photo, i) => (
                          <img
                            key={photo.id || i}
                            src={photo.image_url}
                            alt={t('customer.bookingDetails.portfolioWork')}
                            className="aspect-square rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Style */}
          {selectedStyle && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('customer.booking.yourSelectedStyle')}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 items-center">
                <img
                  src={selectedStyle.generated_image_url}
                  alt={t('customer.booking.selectedStyle')}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <p className="text-sm text-muted-foreground line-clamp-3">{selectedStyle.style_prompt}</p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Select Service */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                {t('booking.selectService')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceCart
                services={services}
                selectedServices={selectedServices}
                onAddService={handleAddService}
                onRemoveService={handleRemoveService}
              />
            </CardContent>
          </Card>

          {/* Step 2: Select Time Slot */}
          {selectedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
                  {t('customer.bookingDetails.chooseTimeSlot')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSlotPicker
                  stylistId={stylist.id}
                  serviceDuration={totalDuration}
                  onSlotSelect={handleSlotSelect}
                  selectedDate={appointmentDate}
                  selectedTime={appointmentTime}
                  customerId={customerId || undefined}
                  serviceId={selectedServices[0].id}
                  serviceName={selectedServices.map(s => s.name).join(", ")}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment & Confirm */}
          {selectedServices.length > 0 && appointmentDate && appointmentTime && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
                    {t('customer.bookingDetails.paymentAndConfirm')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PaymentTimingSelector
                    value={paymentTiming}
                    onChange={setPaymentTiming}
                    servicePrice={serviceTotal}
                  />
                  <TipSelector
                    serviceTotal={serviceTotal}
                    tip={tip}
                    onTipChange={setTip}
                  />
                  <PriceBreakdown 
                    services={selectedServices}
                    tip={tip}
                    platformFeePercent={0}
                    paymentTiming={paymentTiming}
                  />
                </CardContent>
              </Card>

              <Button
                onClick={handleBooking}
                disabled={booking}
                className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {booking ? t('customer.bookingDetails.booking') : paymentTiming === "pay_now" ? t('customer.bookingDetails.confirmAndPay') : t('booking.confirmBooking')}
              </Button>
            </>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerBookingDetails;
