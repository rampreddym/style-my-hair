import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Sparkles, CalendarDays, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const customerNavItems: NavItem[] = [
  { path: "/customer", labelKey: "navigation.profile", icon: User },
  { path: "/customer/style", labelKey: "navigation.style", icon: Sparkles },
  { path: "/customer/booking", labelKey: "navigation.booking", icon: Scissors },
  { path: "/customer/appointments", labelKey: "navigation.appointments", icon: CalendarDays },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check for active path (include sub-routes for booking)
  const isActive = (path: string) => {
    if (path === "/customer/booking") {
      return location.pathname.startsWith("/customer/booking");
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom safe-area-left safe-area-right">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {customerNavItems.map((item) => {
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
              {/* Active indicator dot */}
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
