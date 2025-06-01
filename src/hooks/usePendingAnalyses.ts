
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPendingAnalyses, PendingAnalysis } from "@/utils/pendingAnalysisService";
import { toast } from "sonner";

export const usePendingAnalyses = (userId: string | undefined) => {
  const [pendingAnalyses, setPendingAnalyses] = useState<PendingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchPendingAnalyses = async () => {
      try {
        const analyses = await getPendingAnalyses(userId);
        setPendingAnalyses(analyses);
      } catch (error) {
        console.error('Failed to fetch pending analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingAnalyses();

    // Set up real-time subscription
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
            setPendingAnalyses(prev => [payload.new as PendingAnalysis, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as PendingAnalysis;
            setPendingAnalyses(prev => 
              prev.map(analysis => 
                analysis.id === updated.id ? updated : analysis
              )
            );

            // Show notification for completed or failed analyses
            if (updated.status === 'completed') {
              toast.success(`Analysis complete! Your ${updated.category || 'content'} has been processed.`);
            } else if (updated.status === 'failed') {
              toast.error(`Analysis failed: ${updated.error_message || 'Unknown error'}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setPendingAnalyses(prev => 
              prev.filter(analysis => analysis.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { pendingAnalyses, loading, setPendingAnalyses };
};
