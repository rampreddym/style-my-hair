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
  { path: "/stylist", labelKey: "navigation.profile", icon: User },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom safe-area-left safe-area-right">
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
                "active:scale-95 active:bg-primary/10",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
              )}
              
              <Icon className={cn(
                "w-6 h-6 transition-transform",
                active && "scale-110"
              )} />
              
              <span className={cn(
                "text-[10px] mt-1 font-medium transition-all",
                active ? "text-primary" : "text-muted-foreground"
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
