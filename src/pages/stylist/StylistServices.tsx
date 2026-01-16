import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, DollarSign, Clock } from "lucide-react";
import { StylistLayout } from "@/components/layout/StylistLayout";

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
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Service>({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
  });

  // Fetch stylist ID from auth
  useEffect(() => {
    const fetchStylistId = async () => {
      if (!user) return;
      
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
    
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchStylistId();
      }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (stylistId) {
      fetchServices();
    }
  }, [stylistId]);

  const fetchServices = async () => {
    if (!stylistId) return;
    
    const { data } = await supabase
      .from("stylist_services")
      .select("*")
      .eq("stylist_id", stylistId);

    if (data) setServices(data);
    setLoading(false);
  };

  const addService = async () => {
    if (!stylistId) return;
    
    if (!newService.name || newService.price <= 0) {
      toast({ title: t("stylistServices.fillNamePrice"), variant: "destructive" });
      return;
    }

    const isDuplicate = services.some(
      (s) => s.name.toLowerCase().trim() === newService.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      toast({ title: t("stylistServices.serviceExists"), description: t("stylistServices.serviceExistsDesc"), variant: "destructive" });
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
      toast({ title: t("stylistServices.serviceAdded") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await supabase.from("stylist_services").delete().eq("id", serviceId);
      setServices(services.filter((s) => s.id !== serviceId));
      toast({ title: t("stylistServices.serviceDeleted") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const suggestedServices = [
    { name: t("stylistServices.suggested.haircut"), duration: 45, price: 35 },
    { name: t("stylistServices.suggested.color"), duration: 120, price: 80 },
    { name: t("stylistServices.suggested.highlights"), duration: 150, price: 120 },
    { name: t("stylistServices.suggested.blowout"), duration: 30, price: 25 },
    { name: t("stylistServices.suggested.beardTrim"), duration: 15, price: 15 },
    { name: t("stylistServices.suggested.deepConditioning"), duration: 30, price: 30 },
  ];

  const addSuggestedService = (suggested: typeof suggestedServices[0]) => {
    setNewService({
      name: suggested.name,
      description: "",
      duration_minutes: suggested.duration,
      price: suggested.price,
    });
  };

  if (loading || authLoading) {
    return (
      <StylistLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">{t("stylistServices.loadingServices")}</div>
        </div>
      </StylistLayout>
    );
  }

  return (
    <StylistLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t("stylistServices.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("stylistServices.subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("stylist.services.quickAdd")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedServices.map((s) => (
                  <Button
                    key={s.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addSuggestedService(s)}
                    className="min-h-[44px]"
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-5 h-5" />
                {t("stylist.services.addService")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("stylist.services.serviceName")}</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder={t("stylistServices.serviceNamePlaceholder")}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> {t("stylist.services.servicePrice")}
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={newService.price || ""}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {t("stylist.services.serviceDuration")}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) || 30 })}
                  className="w-32 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("stylistServices.descriptionOptional")}</Label>
                <Textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder={t("stylistServices.descriptionPlaceholder")}
                  rows={2}
                />
              </div>

              <Button onClick={addService} disabled={saving} className="w-full h-14">
                {saving ? t("stylistServices.adding") : t("stylist.services.addService")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("stylistServices.yourServices", { count: services.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("stylist.services.noServices")}. {t("stylist.services.addFirst")}
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex-1">
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
                        className="text-destructive hover:text-destructive min-w-[44px] min-h-[44px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StylistLayout>
  );
};

export default StylistServices;
