import { ReactNode } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";

interface CustomerLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export function CustomerLayout({ children, hideNavigation = false }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col safe-area-top">
      {/* Main content with padding for bottom nav */}
      <main className={hideNavigation ? "" : "pb-nav"}>
        {children}
      </main>
      
      {/* Bottom Navigation */}
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
}
