import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PostAppointmentFeedback } from "@/components/feedback/PostAppointmentFeedback";
import { AppointmentConfirmation } from "@/components/booking/AppointmentConfirmation";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MessageSquare, Star, CheckCircle, ArrowLeft } from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton-loader";

const CustomerAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const feedbackAppointmentId = searchParams.get("feedback");
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(feedbackAppointmentId);
  const [showChat, setShowChat] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCustomerAndAppointments();
  }, [user]);

  const fetchCustomerAndAppointments = async () => {
    if (!user) return;

    // Get customer ID
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

    // Fetch appointments
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(`
        *,
        stylist:stylists(id, name, photo_url, address, user_id),
        service:stylist_services(name, duration_minutes, price),
        feedback:appointment_feedback(sentiment)
      `)
      .eq("customer_id", customer.id)
      .order("appointment_date", { ascending: false });

    if (appointmentsData) {
      setAppointments(appointmentsData);
    }

    setLoading(false);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(null);
    fetchCustomerAndAppointments();
    toast({ title: "Thank you for your feedback!" });
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  // Show feedback form if requested
  if (showFeedback && customerId) {
    const feedbackAppointment = appointments.find((a) => a.id === showFeedback);
    if (feedbackAppointment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
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
              className="w-full mt-4"
            >
              Skip for now
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
            <p className="text-muted-foreground">Manage your bookings</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/customer/booking")}>
            Book New
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No upcoming appointments
              </p>
            ) : (
              upcomingAppointments.map((appointment) => {
                const status = getAppointmentStatus(appointment);
                const showConfirmation = status === "soon" && appointment.check_in_status === "pending";

                return (
                  <div key={appointment.id} className="space-y-3">
                    {showConfirmation && (
                      <AppointmentConfirmation
                        appointmentId={appointment.id}
                        appointmentDate={appointment.appointment_date}
                        stylistName={appointment.stylist?.name || "Your stylist"}
                        stylistAddress={appointment.stylist?.address}
                        onConfirm={() => fetchCustomerAndAppointments()}
                      />
                    )}

                    {!showConfirmation && (
                      <div className="p-4 border rounded-xl">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {appointment.stylist?.photo_url ? (
                              <img
                                src={appointment.stylist.photo_url}
                                alt={appointment.stylist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-semibold text-primary">
                                {appointment.stylist?.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{appointment.stylist?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service?.name}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(appointment.appointment_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(appointment.appointment_date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold text-primary">${appointment.price}</span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setShowChat(appointment.id)}>
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Message
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
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Past Appointments ({pastAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastAppointments.slice(0, 10).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {appointment.stylist?.photo_url ? (
                        <img
                          src={appointment.stylist.photo_url}
                          alt={appointment.stylist.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {appointment.stylist?.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.stylist?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {appointment.feedback ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Reviewed
                      </span>
                    ) : appointment.status === "completed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFeedback(appointment.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Leave Feedback
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => navigate("/customer")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
      </div>
    </div>
  );
};

export default CustomerAppointments;
