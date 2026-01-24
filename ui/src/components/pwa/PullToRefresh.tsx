
import { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { forceCheckForUpdates } = useEnhancedPWAUpdate();

  const PULL_THRESHOLD = 80;
  const MAX_PULL_DISTANCE = 120;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartRef.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY - touchStartRef.current);

    if (pullDistance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(pullDistance, MAX_PULL_DISTANCE));
      setIsPulling(pullDistance > 10);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) {
      setPullDistance(0);
      setIsPulling(false);
      touchStartRef.current = null;
      return;
    }

    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default action: force check for PWA updates
          await forceCheckForUpdates();
        }
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
          touchStartRef.current = null;
        }, 1000);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      touchStartRef.current = null;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance > PULL_THRESHOLD;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull to refresh indicator */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          height: '60px',
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
          <RefreshCw 
            className={`h-6 w-6 text-green-600 transition-all duration-200 ${
              isRefreshing ? 'animate-spin' : shouldTrigger ? 'scale-110' : ''
            }`}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`,
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance * 0.5}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
