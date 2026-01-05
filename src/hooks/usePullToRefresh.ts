import { useState, useCallback, useRef } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      
      const touch = e.touches[0];
      startY.current = touch.clientY;
      
      const scrollElement = e.currentTarget as HTMLElement;
      scrollTop.current = scrollElement.scrollTop;
    },
    [disabled, isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      if (scrollTop.current > 0) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - startY.current;

      if (deltaY > 0) {
        const resistance = 0.5;
        const distance = Math.min(deltaY * resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    },
    [disabled, isRefreshing, threshold]
  );

  const onTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    isRefreshing,
    pullDistance,
    progress,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
