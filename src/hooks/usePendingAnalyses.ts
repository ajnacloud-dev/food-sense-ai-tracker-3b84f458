
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscription with enhanced error handling
    console.log('Setting up real-time subscription for user:', userId);
    const channel = supabase
      .channel('pending-analyses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_analyses',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Pending analysis change:', payload);
          setConnectionStatus('connected');
          
          if (payload.eventType === 'INSERT') {
            const newAnalysis = payload.new as PendingAnalysis;
            setPendingAnalyses(prev => [newAnalysis, ...prev]);
            console.log('Added new pending analysis:', newAnalysis.id);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as PendingAnalysis;
            setPendingAnalyses(prev => 
              prev.map(analysis => 
                analysis.id === updated.id ? updated : analysis
              )
            );

            // Show notification for completed or failed analyses
            if (updated.status === 'completed') {
              toast.success(`Analysis complete!`, {
                description: `Your ${updated.category || 'content'} has been processed successfully.`
              });
              console.log('Analysis completed:', updated.id);
              
              // Force a refresh to ensure we have the latest data
              setTimeout(() => {
                fetchPendingAnalyses();
              }, 1000);
            } else if (updated.status === 'failed') {
              toast.error(`Analysis failed`, {
                description: updated.error_message || 'Unknown error occurred'
              });
              console.log('Analysis failed:', updated.id, updated.error_message);
            } else if (updated.status === 'processing') {
              console.log('Analysis started processing:', updated.id);
            }
          } else if (payload.eventType === 'DELETE') {
            setPendingAnalyses(prev => 
              prev.filter(analysis => analysis.id !== payload.old.id)
            );
            console.log('Removed pending analysis:', payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
          // Attempt to reconnect
          setTimeout(reconnect, 2000);
        }
      });

    return () => {
      console.log('Cleaning up pending analyses subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchPendingAnalyses, setConnectionStatus, reconnect]);

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
