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
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-hairline safe-area-bottom safe-area-left safe-area-right">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {stylistNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-2 transition-colors no-tap-highlight no-select",
                "active:opacity-70",
                active ? "text-brand" : "text-dim hover:text-foreground"
              )}
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
            >
              {active && <span className="absolute top-1 h-1 w-1 rounded-full bg-brand" />}

              <Icon className="w-5 h-5 relative z-10" />

              <span
                className={cn(
                  "eyebrow mt-1.5 relative z-10",
                  active ? "text-brand" : "text-dim"
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