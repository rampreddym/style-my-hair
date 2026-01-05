import { useLocation, useNavigate } from "react-router-dom";
import { User, Sparkles, CalendarDays, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const customerNavItems: NavItem[] = [
  { path: "/customer", label: "Profile", icon: User },
  { path: "/customer/style", label: "Style", icon: Sparkles },
  { path: "/customer/booking", label: "Book", icon: Scissors },
  { path: "/customer/appointments", label: "Appointments", icon: CalendarDays },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {customerNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                // Minimum 44x44px touch target
                "flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-3 py-2 rounded-lg transition-all active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("w-6 h-6", active && "text-primary")} />
              <span className={cn(
                "text-xs mt-1 font-medium",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
