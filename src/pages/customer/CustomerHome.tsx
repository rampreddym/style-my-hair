import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, isTomorrow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { EnhancedStylistCard } from "@/components/stylist/EnhancedStylistCard";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import {
  Sparkles, Scissors, CalendarDays, ChevronRight, MapPin,
  Camera, Clock, RotateCcw, User,
} from "lucide-react";

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [rebookStylists, setRebookStylists] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  const [servicesByStylist, setServicesByStylist] = useState<Record<string, any[]>>({});
  const [portfolioByStylist, setPortfolioByStylist] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: customerRow } = await supabase
      .from("customers")
      .select("id, name, latitude, longitude")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customerRow) {
      navigate("/customer/profile");
      return;
    }
    setCustomer(customerRow);

    const [photosRes, apptRes, stylistsRes, servicesRes, portfolioRes] = await Promise.all([
      supabase.from("customer_photos").select("id").eq("customer_id", customerRow.id),
      supabase
        .from("appointments")
        .select("id, appointment_date, status, stylist:stylists(id, name, photo_url), service:stylist_services(name, duration_minutes)")
        .eq("customer_id", customerRow.id)
        .order("appointment_date", { ascending: true }),
      supabase.from("stylists_public").select("*"),
      supabase.from("stylist_services").select("*"),
      supabase.from("stylist_portfolio").select("stylist_id, image_url"),
    ]);

    setPhotoCount(photosRes.data?.length ?? 0);

    const appts = apptRes.data ?? [];
    const upcoming = appts.find(
      (a: any) =>
        ["pending", "confirmed"].includes(a.status) &&
        new Date(a.appointment_date) >= new Date(Date.now() - 3600_000)
    );
    setNextAppointment(upcoming ?? null);

    const svcMap: Record<string, any[]> = {};
    (servicesRes.data ?? []).forEach((s: any) => {
      (svcMap[s.stylist_id] ??= []).push(s);
    });
    setServicesByStylist(svcMap);

    const pfMap: Record<string, string[]> = {};
    (portfolioRes.data ?? []).forEach((p: any) => {
      (pfMap[p.stylist_id] ??= []).push(p.image_url);
    });
    setPortfolioByStylist(pfMap);

    const all = (stylistsRes.data ?? []).map((s: any) => ({
      ...s,
      distance:
        customerRow.latitude && customerRow.longitude && s.latitude && s.longitude
          ? calculateDistance(customerRow.latitude, customerRow.longitude, s.latitude, s.longitude)
          : null,
    }));

    const seenIds = new Set(
      appts
        .filter((a: any) => a.status === "completed")
        .map((a: any) => a.stylist?.id)
        .filter(Boolean)
    );
    setRebookStylists(all.filter((s: any) => seenIds.has(s.id)).slice(0, 5));

    all.sort((a: any, b: any) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
    setStylists(all.slice(0, 4));
    setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    load();
  }, [user, authLoading, load, navigate]);

  const firstName = (customer?.name ?? "").split(" ")[0];

  const apptWhen = (a: any) => {
    const d = new Date(a.appointment_date);
    const day = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE d MMM");
    return `${day} · ${format(d, "h:mm a")}`;
  };

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="page-radial p-4">
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            <div className="h-10 w-48 bg-secondary/50 rounded animate-pulse" />
            <CardSkeleton count={3} />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="page-radial p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6 pt-2">
          {/* Header */}
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-muted-foreground">
                {format(new Date(), "EEEE d MMMM")}
              </p>
              <h1 className="font-display text-3xl text-foreground leading-tight">
                {firstName ? `Hello, ${firstName}` : "Welcome to Mirra"}
              </h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <LanguageSwitcher variant="icon" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Your profile"
                onClick={() => navigate("/customer/profile")}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Next appointment */}
          {nextAppointment ? (
            <Card
              className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate("/customer/appointments")}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border shrink-0">
                  {nextAppointment.stylist?.photo_url ? (
                    <img
                      src={nextAppointment.stylist.photo_url}
                      alt={nextAppointment.stylist.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Scissors className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-primary">Next appointment</p>
                  <p className="text-foreground truncate">
                    {nextAppointment.service?.name ?? "Appointment"} with {nextAppointment.stylist?.name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {apptWhen(nextAppointment)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          ) : (
            <Card className="p-4 flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">No upcoming appointment.</p>
              <Button size="sm" onClick={() => navigate("/customer/booking")}>
                Book now
              </Button>
            </Card>
          )}

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/customer/style")}
              className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors no-tap-highlight"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-display text-lg text-foreground mt-2 leading-tight">Preview a look</p>
              <p className="text-xs text-muted-foreground mt-0.5">See it on you before you sit</p>
            </button>
            <button
              onClick={() => navigate("/customer/booking")}
              className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors no-tap-highlight"
            >
              <Scissors className="w-5 h-5 text-accent" />
              <p className="font-display text-lg text-foreground mt-2 leading-tight">Find a stylist</p>
              <p className="text-xs text-muted-foreground mt-0.5">Browse work, prices, availability</p>
            </button>
          </div>

          {/* Setup nudges */}
          {photoCount < 5 && (
            <Card className="p-4 flex items-center gap-3 border-dashed">
              <Camera className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Add your hair photos ({photoCount}/5)</p>
                <p className="text-xs text-muted-foreground">Required for accurate AI previews.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/customer/profile")}>
                Add
              </Button>
            </Card>
          )}

          {!customer?.latitude && (
            <Card className="p-4 flex items-center gap-3 border-dashed">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Set your location</p>
                <p className="text-xs text-muted-foreground">So we can show stylists near you and travel times.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/customer/profile")}>
                Set
              </Button>
            </Card>
          )}

          {/* Rebook */}
          {rebookStylists.length > 0 && (
            <section className="space-y-3">
              <h2 className="eyebrow text-muted-foreground flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" /> Book again
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                {rebookStylists.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/customer/booking/${s.id}`)}
                    className="shrink-0 w-24 text-center no-tap-highlight"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-secondary border border-border flex items-center justify-center">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl text-primary">{s.name?.charAt(0)}</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-1.5 truncate">{s.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Nearby stylists */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow text-muted-foreground">
                {customer?.latitude ? "Near you" : "Top stylists"}
              </h2>
              <button
                onClick={() => navigate("/customer/booking")}
                className="text-xs text-primary hover:underline"
              >
                See all
              </button>
            </div>

            {stylists.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No stylists available yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {stylists.map((s) => (
                  <EnhancedStylistCard
                    key={s.id}
                    stylist={s}
                    isSelected={false}
                    onSelect={() => navigate(`/customer/stylist/${s.id}`)}
                    services={servicesByStylist[s.id] ?? []}
                    recentWork={portfolioByStylist[s.id] ?? []}
                    isFavourite={rebookStylists.some((r) => r.id === s.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerHome;
