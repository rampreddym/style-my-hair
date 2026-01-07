import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft, Image, Star, MapPin } from "lucide-react";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { PaymentTimingSelector, PaymentTiming } from "@/components/booking/PaymentTimingSelector";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { CancelAppointmentDialog } from "@/components/booking/CancelAppointmentDialog";
import { RescheduleDialog } from "@/components/booking/RescheduleDialog";

const CustomerBookingDetails = () => {
  const navigate = useNavigate();
  const { stylistId } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [stylist, setStylist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [booked, setBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("pay_now");
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const customerId = sessionStorage.getItem("customerId");

  useEffect(() => {
    if (!customerId) {
      navigate("/customer");
      return;
    }
    if (!stylistId) {
      navigate("/customer/booking");
      return;
    }
    fetchData();
  }, [customerId, stylistId]);

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

    // Fetch stylist details
    const { data: stylistData, error: stylistError } = await supabase
      .from("stylists")
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
    if (!selectedService || !appointmentDate || !appointmentTime) {
      toast({ title: t('customer.bookingDetails.completeAllFields'), variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          customer_id: customerId,
          stylist_id: stylist.id,
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
        stylist: stylist,
        service: selectedService,
      });
      setBooked(true);
      toast({ title: t('booking.bookingConfirmed'), description: t('customer.bookingDetails.appointmentScheduled') });
    } catch (error: any) {
      toast({ title: t('customer.bookingDetails.bookingFailed'), description: error.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4 pb-24">
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
                    {stylist.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {stylist.address}
                      </span>
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
            <CardContent className="space-y-2">
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('customer.bookingDetails.noServicesAvailable')}</p>
              ) : (
                services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(service);
                      setAppointmentDate("");
                      setAppointmentTime("");
                    }}
                    className={`w-full min-h-[56px] p-4 rounded-lg border-2 cursor-pointer transition-all text-left active:scale-[0.98] ${
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
                        {service.duration_minutes} {t('customer.bookingDetails.min')}
                      </span>
                      {service.description && (
                        <span className="truncate">{service.description}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Time Slot */}
          {selectedService && (
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
                  serviceDuration={selectedService.duration_minutes}
                  onSlotSelect={handleSlotSelect}
                  selectedDate={appointmentDate}
                  selectedTime={appointmentTime}
                  customerId={customerId || undefined}
                  serviceId={selectedService.id}
                  serviceName={selectedService.name}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment & Confirm */}
          {selectedService && appointmentDate && appointmentTime && (
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
                    servicePrice={selectedService.price}
                  />
                  <PriceBreakdown 
                    service={selectedService}
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
