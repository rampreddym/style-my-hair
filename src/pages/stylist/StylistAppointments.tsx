import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, Clock, User, Check, X, DollarSign, 
  MessageSquare, History, Sparkles, AlertTriangle
} from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { StylistLayout } from "@/components/layout/StylistLayout";
import { StylistInstructionsCard } from "@/components/stylist/StylistInstructionsCard";

const StylistAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [stylistId, setStylistId] = useState<string | null>(null);

  // Fetch stylist ID from database using authenticated user
  useEffect(() => {
    const fetchStylistId = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: stylistData } = await supabase
        .from("stylists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (stylistData) {
        setStylistId(stylistData.id);
      } else {
        navigate("/stylist");
      }
    };

    fetchStylistId();
  }, [user, navigate]);

  useEffect(() => {
    if (stylistId) {
      fetchAppointments();
    }
  }, [stylistId]);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:customers(id, name, email, phone, gender, age, preferred_style_description, user_id),
        service:stylist_services(name, duration_minutes, price),
        generated_style:customer_generated_styles(style_prompt, generated_image_url)
      `)
      .eq("stylist_id", stylistId)
      .order("appointment_date", { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  };

  const fetchCustomerHistory = async (customerId: string) => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        service:stylist_services(name)
      `)
      .eq("customer_id", customerId)
      .eq("stylist_id", stylistId)
      .eq("status", "completed")
      .order("appointment_date", { ascending: false })
      .limit(5);

    if (data) setCustomerHistory(data);
  };

  const updateStatus = async (appointmentId: string, status: string) => {
    try {
      await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      setAppointments(
        appointments.map((a) => (a.id === appointmentId ? { ...a, status } : a))
      );

      toast({ title: `Appointment ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const saveNotes = async () => {
    if (!selectedAppointment) return;
    
    setSavingNotes(true);
    try {
      await supabase
        .from("appointments")
        .update({ stylist_notes: notes })
        .eq("id", selectedAppointment.id);

      setAppointments(
        appointments.map((a) =>
          a.id === selectedAppointment.id ? { ...a, stylist_notes: notes } : a
        )
      );

      toast({ title: "Notes saved!" });
      setSelectedAppointment(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-200";
    }
  };

  // Calculate travel time estimate (rough: 3 min per km)
  const getTravelTime = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const km = R * c;
    return Math.round(km * 3);
  };

  if (loading) {
    return (
      <StylistLayout>
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Appointments</h1>
              <p className="text-sm text-muted-foreground">Loading your schedule...</p>
            </div>
            <CardSkeleton count={3} />
          </div>
        </div>
      </StylistLayout>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) >= new Date() && a.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) < new Date() || a.status === "completed"
  );

  return (
    <StylistLayout>
      <div className="page-radial p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("stylist.appointments.title", "Your Appointments")}</h1>
              <p className="text-sm text-muted-foreground">{t("stylist.appointments.subtitle", "Manage your bookings")}</p>
            </div>
          </div>

          {/* Upcoming Appointments */}
        <Card className="border border-accent/20 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-accent icon-glow-accent" />
              {t("stylist.appointments.upcoming", "Upcoming")} ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-accent" />
                </div>
                <p className="text-muted-foreground">{t("stylist.appointments.noUpcoming", "No upcoming appointments")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border-2 rounded-xl space-y-4 hover:border-primary/50 transition-colors"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Customer info with photo */}
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {appointment.customer?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {appointment.customer?.name || "Unknown"}
                            </span>
                            <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
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
                          <p className="text-sm mt-1 text-foreground">
                            {appointment.service?.name} · ${appointment.price}
                          </p>
                        </div>
                      </div>

                      {/* AI preview image */}
                      {appointment.generated_style?.generated_image_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors flex-shrink-0">
                              <img
                                src={appointment.generated_style.generated_image_url}
                                alt="Requested style"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Requested Style</DialogTitle>
                            </DialogHeader>
                            <img
                              src={appointment.generated_style.generated_image_url}
                              alt="Requested style"
                              className="w-full rounded-lg"
                            />
                            <div className="bg-card rounded-lg p-4 border">
                              <p className="text-sm font-medium mb-1">AI Description:</p>
                              <p className="text-muted-foreground text-sm">
                                {appointment.ai_style_description || appointment.generated_style.style_prompt}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Previous notes preview */}
                    {appointment.stylist_notes && (
                      <div className="bg-card rounded-lg p-3 text-sm border">
                        <p className="text-xs text-muted-foreground mb-1">Your previous notes:</p>
                        <p className="text-foreground line-clamp-2">{appointment.stylist_notes}</p>
                      </div>
                    )}

                    {/* AI Stylist Instructions */}
                    <StylistInstructionsCard
                      appointmentId={appointment.id}
                      serviceName={appointment.service?.name || "Service"}
                      styleDescription={appointment.ai_style_description || appointment.generated_style?.style_prompt}
                      styleImageUrl={appointment.generated_style?.generated_image_url}
                      customerGender={appointment.customer?.gender}
                      customerAge={appointment.customer?.age}
                      preferredStyleDescription={appointment.customer?.preferred_style_description}
                      previousNotes={appointment.stylist_notes}
                      existingInstructions={appointment.stylist_instructions}
                      onInstructionsGenerated={(instructions) => {
                        setAppointments(
                          appointments.map((a) =>
                            a.id === appointment.id ? { ...a, stylist_instructions: instructions } : a
                          )
                        );
                      }}
                    />

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "confirmed")}
                            className="bg-primary"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => updateStatus(appointment.id, "cancelled")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {appointment.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(appointment.id, "completed")}
                          className="bg-primary"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}

                      {/* In-app chat */}
                      <Dialog open={showChat === appointment.id} onOpenChange={(open) => setShowChat(open ? appointment.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0">
                          {user && appointment.customer?.user_id && (
                            <ChatWindow
                              appointmentId={appointment.id}
                              otherUserId={appointment.customer.user_id}
                              otherUserName={appointment.customer?.name || "Customer"}
                              onBack={() => setShowChat(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      {/* Check-in status indicator */}
                      {appointment.check_in_status === 'confirmed' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Check className="w-3 h-3 mr-1" />
                          Confirmed
                        </Badge>
                      )}
                      {appointment.check_in_status === 'no_show' && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          No Show
                        </Badge>
                      )}

                      {/* View history */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (appointment.customer?.id) {
                                fetchCustomerHistory(appointment.customer.id);
                                setShowHistory(true);
                              }
                            }}
                          >
                            <History className="w-4 h-4 mr-1" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Customer History</DialogTitle>
                          </DialogHeader>
                          {customerHistory.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              No previous appointments
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {customerHistory.map((hist) => (
                                <div key={hist.id} className="p-3 border rounded-lg">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{hist.service?.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(hist.appointment_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {hist.stylist_notes && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      Notes: {hist.stylist_notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {/* Notes */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setNotes(appointment.stylist_notes || "");
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Notes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Client Notes</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this client's preferences, hair type, cut details, products used..."
                            rows={6}
                            className="border-2"
                          />
                          <Button onClick={saveNotes} disabled={savingNotes}>
                            {savingNotes ? "Saving..." : "Save Notes"}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
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
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border rounded-lg flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {appointment.customer?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{appointment.customer?.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {appointment.service?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      </div>
    </StylistLayout>
  );
};

export default StylistAppointments;
