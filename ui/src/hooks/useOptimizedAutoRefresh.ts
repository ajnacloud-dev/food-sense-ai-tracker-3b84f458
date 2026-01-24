
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedAutoRefreshOptions {
  enabled: boolean;
  interval?: number; // Default 5 minutes
  onRefresh: () => Promise<void>;
}

export const useOptimizedAutoRefresh = ({
  enabled,
  interval = 300000, // 5 minutes default instead of 30 seconds
  onRefresh
}: UseOptimizedAutoRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());

  // Track page visibility to pause refresh when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const performRefresh = useCallback(async () => {
    if (!enabled || !isVisible || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
      lastRefreshRef.current = new Date();
      console.log('OptimizedAutoRefresh: Refresh completed at:', lastRefreshRef.current.toISOString());
    } catch (error) {
      console.error('OptimizedAutoRefresh: Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, isVisible, isRefreshing, onRefresh]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || !isVisible) return;

    intervalRef.current = setInterval(performRefresh, interval);
    console.log(`OptimizedAutoRefresh: Started with ${interval / 1000}s interval`);
  }, [enabled, isVisible, interval, performRefresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('OptimizedAutoRefresh: Stopped');
    }
  }, []);

  // Start/stop based on conditions
  useEffect(() => {
    if (enabled && isVisible) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return stopAutoRefresh;
  }, [enabled, isVisible, startAutoRefresh, stopAutoRefresh]);

  return {
    isRefreshing,
    lastRefresh: lastRefreshRef.current,
    performRefresh,
    stopAutoRefresh
  };
};
