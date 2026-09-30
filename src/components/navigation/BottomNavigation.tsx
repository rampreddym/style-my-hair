import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Sparkles, CalendarDays, Scissors, Home } from "lucide-react";
import { PillDock } from "./PillDock";

interface NavItem {
  path: string;
  labelKey: string;
  fallback: string;
  icon: React.ComponentType<{ className?: string }>;
}

const customerNavItems: NavItem[] = [
  { path: "/customer", labelKey: "navigation.home", fallback: "Home", icon: Home },
  { path: "/customer/style", labelKey: "navigation.style", fallback: "Style", icon: Sparkles },
  { path: "/customer/booking", labelKey: "navigation.booking", fallback: "Book", icon: Scissors },
  { path: "/customer/appointments", labelKey: "navigation.appointments", fallback: "Appointments", icon: CalendarDays },
  { path: "/customer/profile", labelKey: "navigation.profile", fallback: "Profile", icon: User },
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
    <PillDock
      items={customerNavItems.map((item) => ({
        path: item.path,
        label: t(item.labelKey, (item as any).fallback) as string,
        icon: item.icon,
        active: isActive(item.path),
      }))}
    />
  );
}
