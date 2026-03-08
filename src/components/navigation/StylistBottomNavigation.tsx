import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Calendar, DollarSign, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const stylistNavItems: NavItem[] = [
  { path: "/stylist/profile", labelKey: "navigation.profile", icon: User },
  { path: "/stylist/services", labelKey: "navigation.services", icon: Scissors },
  { path: "/stylist/appointments", labelKey: "navigation.appointments", icon: Calendar },
  { path: "/stylist/payments", labelKey: "navigation.payments", icon: DollarSign },
];

export function StylistBottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-accent/10 safe-area-bottom safe-area-left safe-area-right">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {stylistNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-2 rounded-xl transition-all no-tap-highlight no-select",
                "active:scale-90",
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
            >
              {/* Active glow background */}
              {active && (
                <span className="absolute inset-0 rounded-xl bg-accent/10 animate-scale-in" />
              )}
              
              {/* Active indicator line */}
              {active && (
                <span className="absolute -top-[1px] w-8 h-[3px] rounded-full bg-gradient-accent animate-in fade-in zoom-in duration-200" />
              )}
              
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-all",
                active && "scale-110 icon-glow-accent"
              )} />
              
              <span className={cn(
                "text-[10px] mt-1 font-semibold relative z-10 transition-all",
                active ? "text-accent" : "text-muted-foreground"
              )}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}