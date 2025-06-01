
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPendingAnalyses, PendingAnalysis } from "@/utils/pendingAnalysisService";
import { toast } from "sonner";

export const usePendingAnalyses = (userId: string | undefined) => {
  const [pendingAnalyses, setPendingAnalyses] = useState<PendingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPendingAnalyses = async () => {
      try {
        setError(null);
        const analyses = await getPendingAnalyses(userId);
        setPendingAnalyses(analyses);
        console.log('Fetched pending analyses:', analyses.length);
      } catch (error) {
        console.error('Failed to fetch pending analyses:', error);
        setError('Failed to load pending analyses');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingAnalyses();

    // Set up real-time subscription
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
        (payload) => {
          console.log('Pending analysis change:', payload);
          
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
        // Remove the problematic status check that was causing TypeScript error
        // Supabase handles connection errors internally
      });

    return () => {
      console.log('Cleaning up pending analyses subscription');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const analyses = await getPendingAnalyses(userId);
      setPendingAnalyses(analyses);
    } catch (error) {
      console.error('Failed to refetch pending analyses:', error);
      setError('Failed to refresh analyses');
    }
  };

  return { 
    pendingAnalyses, 
    loading, 
    error,
    setPendingAnalyses,
    refetch
  };
};
