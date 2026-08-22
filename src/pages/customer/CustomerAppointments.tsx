import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PostAppointmentFeedback } from "@/components/feedback/PostAppointmentFeedback";
import { AppointmentConfirmation } from "@/components/booking/AppointmentConfirmation";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { CancelAppointmentDialog } from "@/components/booking/CancelAppointmentDialog";
import { RescheduleDialog } from "@/components/booking/RescheduleDialog";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh-indicator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MessageSquare, Star, CheckCircle, X, RefreshCw, CalendarPlus, Sparkles } from "lucide-react";
import { StylistLocationLink } from "@/components/map/StylistLocationLink";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { CustomerLayout } from "@/components/layout/CustomerLayout";

const CustomerAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const feedbackAppointmentId = searchParams.get("feedback");
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(feedbackAppointmentId);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<any>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCustomerAndAppointments();
  }, [user]);

  const fetchCustomerAndAppointments = useCallback(async () => {
    if (!user) return;

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer) {
      navigate("/customer");
      return;
    }

    setCustomerId(customer.id);

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(`
        *,
        stylist:stylists(id, name, photo_url, address, user_id, latitude, longitude),
        service:stylist_services(id, name, duration_minutes, price),
        feedback:appointment_feedback(sentiment)
      `)
      .eq("customer_id", customer.id)
      .order("appointment_date", { ascending: false });

    if (appointmentsData) {
      setAppointments(appointmentsData);
    }

    setLoading(false);
  }, [user, navigate]);

  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({
    onRefresh: fetchCustomerAndAppointments,
  });

  const handleFeedbackComplete = () => {
    setShowFeedback(null);
    fetchCustomerAndAppointments();
    toast({ title: t("customer.appointments.thankYouFeedback", "Thank you for your feedback!") });
  };

  const getAppointmentStatus = (appointment: any) => {
    const now = new Date();
    const appointmentTime = new Date(appointment.appointment_date);
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (appointment.status === "completed") return "completed";
    if (appointment.status === "cancelled") return "cancelled";
    if (hoursUntil < 0) return "past";
    if (hoursUntil <= 2) return "soon";
    return "upcoming";
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="page-radial p-4">
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            <h1 className="text-2xl font-bold text-foreground">{t("customer.appointments.title", "My Appointments")}</h1>
            <CardSkeleton count={3} />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (showFeedback && customerId) {
    const feedbackAppointment = appointments.find((a) => a.id === showFeedback);
    if (feedbackAppointment) {
      return (
        <CustomerLayout>
          <div className="page-radial p-4">
            <div className="max-w-md mx-auto pt-8">
              <PostAppointmentFeedback
                appointmentId={showFeedback}
                customerId={customerId}
                stylistName={feedbackAppointment.stylist?.name || "your stylist"}
                onComplete={handleFeedbackComplete}
              />
              <Button
                variant="ghost"
                onClick={() => setShowFeedback(null)}
                className="w-full mt-4 min-h-[44px]"
              >
                {t("common.skipForNow", "Skip for now")}
              </Button>
            </div>
          </div>
        </CustomerLayout>
      );
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) => getAppointmentStatus(a) === "upcoming" || getAppointmentStatus(a) === "soon"
  );
  const pastAppointments = appointments.filter(
    (a) => getAppointmentStatus(a) === "completed" || getAppointmentStatus(a) === "past"
  );

  return (
    <CustomerLayout>
      <div 
        className="page-radial p-4 scroll-smooth-touch"
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance} 
          isRefreshing={isRefreshing} 
        />
        
        <div className="max-w-2xl mx-auto space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("customer.appointments.title", "My Appointments")}</h1>
              <p className="text-sm text-muted-foreground">{t("customer.appointments.subtitle", "Manage your bookings")}</p>
            </div>
            <Button 
              onClick={() => navigate("/customer/booking")} 
              className="min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              {t("customer.appointments.bookNew", "Book New")}
            </Button>
          </div>

          {/* Empty State */}
          {appointments.length === 0 && (
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{t("customer.appointments.noAppointments", "No appointments yet")}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{t("customer.appointments.bookFirst", "Book your first appointment with a nearby stylist!")}</p>
                </div>
                <Button 
                  onClick={() => navigate("/customer/booking")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {t("customer.appointments.findStylists", "Find Stylists")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <Card variant="glow" className="border border-primary/20 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-foreground">{t("customer.appointments.upcoming", "Upcoming")} ({upcomingAppointments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  const showConfirmation = status === "soon" && appointment.check_in_status === "pending";

                  return (
                    <div key={appointment.id} className="space-y-3 animate-fade-in">
                      {showConfirmation && (
                        <AppointmentConfirmation
                          appointmentId={appointment.id}
                          appointmentDate={appointment.appointment_date}
                          stylistName={appointment.stylist?.name || "Your stylist"}
                          stylistAddress={appointment.stylist?.address}
                          stylistLatitude={appointment.stylist?.latitude}
                          stylistLongitude={appointment.stylist?.longitude}
                          onConfirm={() => fetchCustomerAndAppointments()}
                        />
                      )}

                      {!showConfirmation && (
                        <div className="p-4 border border-border/50 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/30 flex-shrink-0">
                              {appointment.stylist?.photo_url ? (
                                <img src={appointment.stylist.photo_url} alt={appointment.stylist.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-semibold text-primary">{appointment.stylist?.name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">{appointment.stylist?.name}</p>
                              <p className="text-sm text-muted-foreground">{appointment.service?.name}</p>
                              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-accent" />
                                  {new Date(appointment.appointment_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-info" />
                                  {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {(appointment.stylist?.address || appointment.stylist?.latitude) && (
                                <StylistLocationLink
                                  address={appointment.stylist.address}
                                  latitude={appointment.stylist.latitude}
                                  longitude={appointment.stylist.longitude}
                                  stylistName={appointment.stylist.name}
                                  variant="inline"
                                  className="mt-1"
                                />
                              )}
                            </div>
                            <span className="font-bold text-lg text-primary flex-shrink-0">${appointment.price}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="min-h-[44px] bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 font-medium" variant="outline" onClick={() => setShowChat(appointment.id)}>
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  {t("customer.appointments.message", "Message")}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md p-0">
                                {user && appointment.stylist?.user_id && (
                                  <ChatWindow
                                    appointmentId={appointment.id}
                                    otherUserId={appointment.stylist.user_id}
                                    otherUserName={appointment.stylist?.name || "Stylist"}
                                    otherUserPhoto={appointment.stylist?.photo_url}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              className="min-h-[44px] bg-info/10 text-info hover:bg-info/20 border border-info/20 font-medium"
                              variant="outline"
                              onClick={() => setRescheduleAppointment(appointment)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              {t("customer.appointments.reschedule", "Reschedule")}
                            </Button>
                            
                            <Button
                              className="min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 font-medium"
                              variant="outline"
                              onClick={() => setCancelAppointment(appointment)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t("customer.appointments.cancel", "Cancel")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground text-base">
                  {t("customer.appointments.past", "Past Appointments")} ({pastAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pastAppointments.slice(0, 10).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border border-border/30 rounded-xl flex items-center justify-between hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {appointment.stylist?.photo_url ? (
                          <img src={appointment.stylist.photo_url} alt={appointment.stylist.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">{appointment.stylist?.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{appointment.stylist?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.feedback ? (
                        <span className="text-sm text-success flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {t("customer.appointments.reviewed", "Reviewed")}
                        </span>
                      ) : appointment.status === "completed" ? (
                        <Button
                          className="min-h-[44px] bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 font-medium"
                          variant="outline"
                          onClick={() => setShowFeedback(appointment.id)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {t("customer.appointments.leaveFeedback", "Review")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dialogs */}
          {cancelAppointment && (
            <CancelAppointmentDialog
              open={!!cancelAppointment}
              onOpenChange={(open) => !open && setCancelAppointment(null)}
              appointmentId={cancelAppointment.id}
              appointmentDate={cancelAppointment.appointment_date}
              stylistName={cancelAppointment.stylist?.name || "Stylist"}
              stylistId={cancelAppointment.stylist?.id}
              serviceId={cancelAppointment.service?.id}
              onCancelled={() => {
                setCancelAppointment(null);
                fetchCustomerAndAppointments();
              }}
            />
          )}

          {rescheduleAppointment && (
            <RescheduleDialog
              open={!!rescheduleAppointment}
              onOpenChange={(open) => !open && setRescheduleAppointment(null)}
              appointmentId={rescheduleAppointment.id}
              stylistId={rescheduleAppointment.stylist?.id}
              stylistName={rescheduleAppointment.stylist?.name || "Stylist"}
              serviceDuration={rescheduleAppointment.service?.duration_minutes || 30}
              currentDate={rescheduleAppointment.appointment_date}
              onRescheduled={() => {
                setRescheduleAppointment(null);
                fetchCustomerAndAppointments();
              }}
            />
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerAppointments;