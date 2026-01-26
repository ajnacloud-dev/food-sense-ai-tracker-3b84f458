import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * NOTE: This hook is deprecated. The backend queue system has been removed
 * in favor of direct analysis via /v1/analyze endpoint.
 *
 * This hook is kept for backward compatibility but no longer uses queue endpoints.
 * Consider using usePendingAnalyses for tracking analysis status instead.
 */

interface QueueJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  progress: number;
  created_at: string;
  completed_at?: string;
  result?: any;
  error?: string;
}

export const useAnalysisQueue = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Queue a new analysis
  // NOTE: Creates pending_analyses record and processes in background
  const queueAnalysis = async (description: string, imageUrl?: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create pending analysis record
      const analysisId = crypto.randomUUID();
      const estimatedCompletion = new Date();
      estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 2);

      await api.post('/v1/pending_analyses', {
        id: analysisId,
        user_id: user.id,
        description: description || 'AI-analyzed content',
        image_url: imageUrl,
        status: 'processing',
        category: 'food',
        estimated_completion: estimatedCompletion.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Process analysis in background (don't await)
      api.post('/v1/analyze', {
        category: 'food',
        description,
        image_url: imageUrl,
        user_id: user.id,
        pending_analysis_id: analysisId
      }).then(response => {
        console.log('Analysis completed:', response.data);
        // Update pending_analyses to completed (backend should do this)
      }).catch(error => {
        console.error('Background analysis failed:', error);
        // Update pending_analyses to failed (backend should do this)
      });

      return { success: true, jobId: analysisId };
    } catch (error: any) {
      console.error('Queue error:', error);
      toast.error('Failed to queue analysis');
      return { success: false, error: error.message };
    }
  };

  // Poll for job status
  // NOTE: Polling removed - direct analysis is synchronous now
  const startPolling = (jobId: string) => {
    // No-op: Direct analysis doesn't require polling
    console.log('Polling not needed for direct analysis');
  };

  // Fetch all user jobs
  // NOTE: Queue system removed from backend - returning empty array
  const fetchJobs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Backend no longer has queue endpoints, return empty array
      setJobs([]);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled', {
          description: 'You\'ll be notified when analysis completes'
        });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Fetch jobs on mount
  useEffect(() => {
    if (user) {
      fetchJobs();
      requestNotificationPermission();
    }
  }, [user, fetchJobs]);

  return {
    jobs,
    loading,
    queueAnalysis,
    fetchJobs,
    requestNotificationPermission
  };
};