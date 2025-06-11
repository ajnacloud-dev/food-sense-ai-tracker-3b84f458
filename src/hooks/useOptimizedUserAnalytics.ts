
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserUsageData, UserMetrics } from "@/types/userAnalytics";

export const useOptimizedUserAnalytics = () => {
  const [allUsers, setAllUsers] = useState<UserUsageData[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalUsers: 0,
    totalActiveUsers: 0,
    usersAnalysesToday: 0,
    totalSubscribedUsers: 0,
    averageAnalysesPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  const fetchOptimizedUserData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('OptimizedUserAnalytics: Starting optimized data fetch...');
      
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      // Single optimized query to get all user data with aggregated metrics
      const { data: usersWithMetrics, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          is_subscribed,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      if (!usersWithMetrics || usersWithMetrics.length === 0) {
        console.log('OptimizedUserAnalytics: No users found');
        setAllUsers([]);
        setMetrics({
          totalUsers: 0,
          totalActiveUsers: 0,
          usersAnalysesToday: 0,
          totalSubscribedUsers: 0,
          averageAnalysesPerUser: 0
        });
        return;
      }

      console.log('OptimizedUserAnalytics: Found', usersWithMetrics.length, 'users');

      // Get aggregated analysis data in one query
      const { data: analysisData } = await supabase
        .from('api_costs')
        .select('user_id, created_at')
        .in('user_id', usersWithMetrics.map(u => u.id));

      // Get billing data aggregated
      const { data: billingData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_date, usage_count')
        .in('user_id', usersWithMetrics.map(u => u.id));

      // Process data efficiently
      const userMetricsMap = new Map();
      const weeklyDataMap = new Map();

      // Initialize all users with zero metrics
      usersWithMetrics.forEach(user => {
        userMetricsMap.set(user.id, {
          todayAnalyses: 0,
          totalAnalyses: 0,
          todayBilledUsage: 0,
          totalBilledUsage: 0,
          lastActive: null,
          lastActivityType: null,
          weeklyAnalyses: Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return { date: date.toISOString().split('T')[0], count: 0 };
          })
        });
      });

      // Process analysis data
      if (analysisData) {
        analysisData.forEach(analysis => {
          const metrics = userMetricsMap.get(analysis.user_id);
          if (metrics) {
            metrics.totalAnalyses++;
            
            const analysisDate = analysis.created_at.split('T')[0];
            if (analysisDate === today) {
              metrics.todayAnalyses++;
            }

            // Update last active
            if (!metrics.lastActive || analysis.created_at > metrics.lastActive) {
              metrics.lastActive = analysis.created_at;
              metrics.lastActivityType = 'completed analysis';
            }

            // Update weekly data
            const weekIndex = metrics.weeklyAnalyses.findIndex(w => w.date === analysisDate);
            if (weekIndex >= 0) {
              metrics.weeklyAnalyses[weekIndex].count++;
            }
          }
        });
      }

      // Process billing data
      if (billingData) {
        billingData.forEach(billing => {
          const metrics = userMetricsMap.get(billing.user_id);
          if (metrics) {
            metrics.totalBilledUsage += billing.usage_count || 0;
            if (billing.usage_date === today) {
              metrics.todayBilledUsage += billing.usage_count || 0;
            }
          }
        });
      }

      // Combine user data with metrics
      const combinedData: UserUsageData[] = usersWithMetrics.map(user => {
        const metrics = userMetricsMap.get(user.id);
        return {
          ...user,
          ...metrics
        };
      });

      console.log('OptimizedUserAnalytics: Processed', combinedData.length, 'users with metrics');

      // Calculate global metrics
      const totalUsers = combinedData.length;
      const totalActiveUsers = combinedData.filter(user => 
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      ).length;
      const usersAnalysesToday = combinedData.filter(user => user.todayAnalyses > 0).length;
      const totalSubscribedUsers = combinedData.filter(user => user.is_subscribed).length;
      const totalAnalysesAll = combinedData.reduce((sum, user) => sum + user.totalAnalyses, 0);
      const averageAnalysesPerUser = totalUsers > 0 ? totalAnalysesAll / totalUsers : 0;

      setAllUsers(combinedData);
      setMetrics({
        totalUsers,
        totalActiveUsers,
        usersAnalysesToday,
        totalSubscribedUsers,
        averageAnalysesPerUser
      });

      setLastFetch(new Date());
      console.log('OptimizedUserAnalytics: Data fetch completed successfully');

    } catch (error) {
      console.error('Error fetching optimized user data:', error);
      toast.error('Failed to load user analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchOptimizedUserData();
  }, [fetchOptimizedUserData]);

  return {
    allUsers,
    metrics,
    loading,
    lastFetch,
    refetch: fetchOptimizedUserData
  };
};
