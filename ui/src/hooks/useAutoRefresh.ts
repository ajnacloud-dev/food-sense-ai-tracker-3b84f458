
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  enabled: boolean;
  interval?: number;
  fastInterval?: number;
  slowInterval?: number;
  onRefresh: () => Promise<void>;
}

export const useAutoRefresh = ({
  enabled,
  interval = 30000, // 30 seconds default
  fastInterval = 10000, // 10 seconds when processing
  slowInterval = 60000, // 1 minute when idle
  onRefresh
}: UseAutoRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());

  // Track page visibility
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
      setConnectionStatus('connected');
      await onRefresh();
      lastRefreshRef.current = new Date();
      console.log('Auto-refresh completed at:', lastRefreshRef.current.toISOString());
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, isVisible, isRefreshing, onRefresh]);

  const startAutoRefresh = useCallback((customInterval?: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || !isVisible) return;

    const refreshInterval = customInterval || interval;
    intervalRef.current = setInterval(performRefresh, refreshInterval);
    console.log(`Auto-refresh started with ${refreshInterval}ms interval`);
  }, [enabled, isVisible, interval, performRefresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Auto-refresh stopped');
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
    isVisible,
    connectionStatus,
    lastRefresh: lastRefreshRef.current,
    performRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    setConnectionStatus
  };
};
