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

  const isActive = (path: string) => {
    if (path === "/customer/booking") {
      return location.pathname.startsWith("/customer/booking");
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom safe-area-left safe-area-right">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {customerNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-2 transition-colors no-tap-highlight no-select",
                "active:opacity-70",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator rule */}
              {active && (
                <span className="absolute -top-px w-10 h-px bg-primary" />
              )}

              <Icon className="w-5 h-5 relative z-10" />

              <span
                className={cn(
                  "eyebrow mt-1.5 relative z-10",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}