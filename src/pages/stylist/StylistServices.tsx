import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowRight, ArrowLeft, DollarSign, Clock } from "lucide-react";

interface Service {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

const StylistServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
  });

  const stylistId = sessionStorage.getItem("stylistId");

  useEffect(() => {
    if (!stylistId) {
      navigate("/stylist");
      return;
    }
    fetchServices();
  }, [stylistId]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylistId);

    if (data) setServices(data);
    setLoading(false);
  };

  const addService = async () => {
    if (!newService.name || newService.price <= 0) {
      toast({ title: "Please fill in name and price", variant: "destructive" });
      return;
    }

    // Check for duplicate service name (case-insensitive)
    const isDuplicate = services.some(
      (s) => s.name.toLowerCase().trim() === newService.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      toast({ title: "Service already exists", description: "A service with this name has already been added", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("stylist_services")
        .insert({
          stylist_id: stylistId,
          name: newService.name.trim(),
          description: newService.description,
          duration_minutes: newService.duration_minutes,
          price: newService.price,
        })
        .select()
        .single();

      if (error) throw error;

      setServices([...services, data]);
      setNewService({ name: "", description: "", duration_minutes: 30, price: 0 });
      toast({ title: "Service added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await supabase.from("stylist_services").delete().eq("id", serviceId);
      setServices(services.filter((s) => s.id !== serviceId));
      toast({ title: "Service deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const suggestedServices = [
    { name: "Haircut", duration: 45, price: 35 },
    { name: "Color", duration: 120, price: 80 },
    { name: "Highlights", duration: 150, price: 120 },
    { name: "Blowout", duration: 30, price: 25 },
    { name: "Beard Trim", duration: 15, price: 15 },
    { name: "Deep Conditioning", duration: 30, price: 30 },
  ];

  const addSuggestedService = (suggested: typeof suggestedServices[0]) => {
    setNewService({
      name: suggested.name,
      description: "",
      duration_minutes: suggested.duration,
      price: suggested.price,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Configure Your Services</h1>
          <p className="text-muted-foreground">Set up the services you offer and their prices</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedServices.map((s) => (
                <Button
                  key={s.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addSuggestedService(s)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Haircut"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Price
                </Label>
                <Input
                  type="number"
                  value={newService.price || ""}
                  onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Duration (minutes)
              </Label>
              <Input
                type="number"
                value={newService.duration_minutes}
                onChange={(e) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) || 30 })}
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Describe what this service includes..."
                rows={2}
              />
            </div>

            <Button onClick={addService} disabled={saving} className="w-full">
              {saving ? "Adding..." : "Add Service"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No services added yet. Add your first service above!
              </p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {service.price}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => service.id && deleteService(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/stylist")} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <Button
            onClick={() => navigate("/stylist/appointments")}
            className="flex-1 bg-gradient-to-r from-accent to-primary hover:opacity-90"
          >
            View Appointments
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StylistServices;