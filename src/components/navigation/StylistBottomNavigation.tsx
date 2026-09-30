import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Calendar, DollarSign, Scissors } from "lucide-react";
import { PillDock } from "./PillDock";

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
    <PillDock
      items={stylistNavItems.map((item) => ({
        path: item.path,
        label: t(item.labelKey, undefined) as string,
        icon: item.icon,
        active: isActive(item.path),
      }))}
    />
  );
}
