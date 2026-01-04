import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Check, X, ArrowLeft, DollarSign, Image, MessageSquare } from "lucide-react";

const StylistAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const stylistId = sessionStorage.getItem("stylistId");

  useEffect(() => {
    if (!stylistId) {
      navigate("/stylist");
      return;
    }
    fetchAppointments();
  }, [stylistId]);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:customers(name, email, phone),
        service:stylist_services(name, duration_minutes, price),
        generated_style:customer_generated_styles(style_prompt, generated_image_url)
      `)
      .eq("stylist_id", stylistId)
      .order("appointment_date", { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
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
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-yellow-500/10 text-yellow-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading appointments...</div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) >= new Date() && a.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) < new Date() || a.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Appointments</h1>
            <p className="text-muted-foreground">Manage your bookings and client notes</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/stylist/payments")}>
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.customer?.name || "Unknown"}</span>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {appointment.price}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{appointment.service?.name}</p>
                      </div>

                      {appointment.generated_style?.generated_image_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative w-16 h-16 rounded-lg overflow-hidden border">
                              <img
                                src={appointment.generated_style.generated_image_url}
                                alt="Requested style"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Image className="w-4 h-4" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Requested Style</DialogTitle>
                            </DialogHeader>
                            <img
                              src={appointment.generated_style.generated_image_url}
                              alt="Requested style"
                              className="w-full rounded-lg"
                            />
                            <p className="text-muted-foreground">
                              {appointment.ai_style_description || appointment.generated_style.style_prompt}
                            </p>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "confirmed")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
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
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
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
                            placeholder="Add notes about this client's preferences, hair type, cut details..."
                            rows={6}
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

        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments ({pastAppointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border rounded-lg flex items-center justify-between opacity-70"
                  >
                    <div>
                      <span className="font-medium">{appointment.customer?.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {appointment.service?.name}
                      </span>
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

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/stylist/services")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StylistAppointments;