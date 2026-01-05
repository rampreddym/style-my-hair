import { ReactNode } from "react";
import { StylistBottomNavigation } from "@/components/navigation/StylistBottomNavigation";

interface StylistLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function StylistLayout({ children, hideNav = false }: StylistLayoutProps) {
  return (
    <div className="min-h-screen bg-background safe-area-top">
      <main className={hideNav ? "" : "pb-nav"}>
        {children}
      </main>
      {!hideNav && <StylistBottomNavigation />}
    </div>
  );
}
