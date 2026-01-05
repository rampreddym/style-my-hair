import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
  className,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center transition-all overflow-hidden",
        className
      )}
      style={{
        height: isRefreshing ? 56 : pullDistance,
        opacity: isRefreshing ? 1 : progress,
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10",
          isRefreshing && "animate-spin"
        )}
        style={{
          transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
        }}
      >
        <RefreshCw className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}
