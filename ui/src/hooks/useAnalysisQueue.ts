import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  const queueAnalysis = async (description: string, imageUrl?: string) => {
    try {
      const response = await api.post('/v1/queue/analysis', {
        description,
        imageUrl
      });

      if (response.data.success) {
        const jobId = response.data.job_id;

        // Show notification
        toast.info('Analysis queued', {
          description: 'Your food is being analyzed in the background',
          duration: 3000
        });

        // Start polling for this job
        startPolling(jobId);

        return { success: true, jobId };
      } else {
        throw new Error(response.data.error || 'Failed to queue analysis');
      }
    } catch (error: any) {
      console.error('Queue error:', error);
      toast.error('Failed to queue analysis');
      return { success: false, error: error.message };
    }
  };

  // Poll for job status
  const startPolling = (jobId: string) => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/v1/queue/status/${jobId}`);
        const job = response.data;

        if (job.status === 'completed') {
          clearInterval(interval);

          // Show success notification
          const result = job.result;
          toast.success('Analysis Complete!', {
            description: `${result.description} - ${result.calories} calories`,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = `/food/${result.food_entry_id}`;
              }
            }
          });

          // Request browser notification permission
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Food Analysis Complete', {
              body: `${result.description} - ${result.calories} calories`,
              icon: '/icon-192.png',
              tag: jobId,
              requireInteraction: false
            });
          }

          // Refresh jobs list
          fetchJobs();
        } else if (job.status === 'failed') {
          clearInterval(interval);

          toast.error('Analysis Failed', {
            description: job.error || 'Unknown error occurred',
            duration: 5000
          });
        } else if (job.status === 'processing') {
          // Update progress
          toast.loading(`Analyzing... ${job.progress}%`, {
            id: `progress-${jobId}`
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // Fetch all user jobs
  const fetchJobs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.get('/v1/queue/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
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