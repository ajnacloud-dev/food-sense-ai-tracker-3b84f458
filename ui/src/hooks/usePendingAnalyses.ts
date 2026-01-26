
import { useState, useEffect, useCallback } from "react";
import { getPendingAnalyses, PendingAnalysis, cleanupInconsistentAnalyses } from "@/utils/pendingAnalysisService";
import { cleanupStuckAnalyses } from "@/utils/analysisCleanup";
import { useAutoRefresh } from "./useAutoRefresh";
import { useConnectionMonitor } from "./useConnectionMonitor";
import { toast } from "sonner";

export const usePendingAnalyses = (userId: string | undefined) => {
  const [pendingAnalyses, setPendingAnalyses] = useState<PendingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection monitoring
  const { isOnline, supabaseConnected, reconnect } = useConnectionMonitor();

  const fetchPendingAnalyses = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const analyses = await getPendingAnalyses(userId);
      setPendingAnalyses(analyses);
      console.log('Fetched pending analyses:', analyses.length);

      // Auto-cleanup inconsistent data when fetching
      const inconsistent = analyses.filter(a =>
        a.status === 'pending' && a.completed_at !== null
      );

      if (inconsistent.length > 0) {
        console.log(`Found ${inconsistent.length} inconsistent analyses, cleaning up...`);
        await cleanupInconsistentAnalyses(userId);
        // Refetch after cleanup
        const cleanedAnalyses = await getPendingAnalyses(userId);
        setPendingAnalyses(cleanedAnalyses);
      }

      // Cleanup stuck analyses (older than 1 hour)
      const stuckCleanup = await cleanupStuckAnalyses(userId);
      if (stuckCleanup.cleaned > 0) {
        console.log(`Cleaned up ${stuckCleanup.cleaned} stuck analyses`);
        // Refetch after cleanup
        const finalAnalyses = await getPendingAnalyses(userId);
        setPendingAnalyses(finalAnalyses);
      }

    } catch (error) {
      console.error('Failed to fetch pending analyses:', error);
      setError('Failed to load pending analyses');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Determine if auto-refresh should be enabled
  const hasPendingOrProcessing = pendingAnalyses.some(a =>
    (a.status === 'pending' && !a.completed_at) || a.status === 'processing'
  );

  // Auto-refresh setup
  const {
    isRefreshing,
    isVisible,
    connectionStatus,
    lastRefresh,
    performRefresh,
    setConnectionStatus
  } = useAutoRefresh({
    enabled: hasPendingOrProcessing && isOnline && supabaseConnected,
    interval: hasPendingOrProcessing ? 15000 : 60000, // 15s when pending, 1min when idle
    onRefresh: fetchPendingAnalyses
  });

  useEffect(() => {
    fetchPendingAnalyses();
  }, [fetchPendingAnalyses]);

  // Supabase Realtime removed - relying on Auto-Refresh for now
  /* 
  useEffect(() => {
    // ... Realtime logic removed for migration ...
  }, [userId]); 
  */

  const refetch = useCallback(async () => {
    await fetchPendingAnalyses();
  }, [fetchPendingAnalyses]);

  const forceRefresh = useCallback(async () => {
    setLoading(true);
    await fetchPendingAnalyses();
  }, [fetchPendingAnalyses]);

  return {
    pendingAnalyses,
    loading,
    error,
    setPendingAnalyses,
    refetch,
    forceRefresh,
    // Auto-refresh states
    isRefreshing,
    isVisible,
    connectionStatus,
    lastRefresh,
    performRefresh: performRefresh,
    autoRefreshEnabled: hasPendingOrProcessing && isOnline && supabaseConnected
  };
};
