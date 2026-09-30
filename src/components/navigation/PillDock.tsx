import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface DockItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

/** Floating dark pill navigation (Luxe Editorial). */
export function PillDock({ items }: { items: DockItem[] }) {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[min(92%,26rem)] rounded-full bg-foreground/95 p-1.5 shadow-2xl backdrop-blur-md safe-area-bottom"
      aria-label="Main"
    >
      <ul className="flex items-center justify-between gap-1">
        {items.map(({ path, label, icon: Icon, active }) => (
          <li key={path} className="flex-1">
            <button
              onClick={() => navigate(path)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex w-full min-h-[48px] flex-col items-center justify-center rounded-full px-1 transition-colors no-tap-highlight",
                active ? "bg-background text-foreground" : "text-background/60 hover:text-background"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 max-w-full truncate text-[10px] font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
