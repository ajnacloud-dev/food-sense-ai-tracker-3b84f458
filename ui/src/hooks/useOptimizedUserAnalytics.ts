
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
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
      console.log('OptimizedUserAnalytics: Starting comprehensive data fetch...');

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      // Step 1: Get ALL users first
      console.log('Step 1: Fetching all users...');
      // Step 1: Get ALL users first
      console.log('Step 1: Fetching all users...');
      const { data: usersWithMetrics, error: usersError } = await api.from('users').select();

      if (usersWithMetrics) {
        usersWithMetrics.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log('Raw users fetched:', usersWithMetrics?.length || 0);

      if (!usersWithMetrics || usersWithMetrics.length === 0) {
        console.log('No users found in database');
        setAllUsers([]);
        setMetrics({
          totalUsers: 0,
          totalActiveUsers: 0,
          usersAnalysesToday: 0,
          totalSubscribedUsers: 0,
          averageAnalysesPerUser: 0
        });
        setLoading(false);
        return;
      }

      const userIds = usersWithMetrics.map(u => u.id);
      console.log('User IDs to fetch data for:', userIds.length);

      // Step 2: Get analysis data for all users
      console.log('Step 2: Fetching analysis data...');
      // Step 2: Get analysis data for all users
      console.log('Step 2: Fetching analysis data...');
      const { data: rawAnalysisData, error: analysisError } = await api.from('api_costs').select();

      const analysisData = rawAnalysisData ? rawAnalysisData.filter((a: any) => userIds.includes(a.user_id)) : [];

      if (analysisError) {
        console.error('Error fetching analysis data:', analysisError);
      }

      console.log('Analysis records found:', analysisData?.length || 0);

      // Step 3: Get billing data
      console.log('Step 3: Fetching billing data...');
      // Step 3: Get billing data
      console.log('Step 3: Fetching billing data...');
      const { data: rawBillingData, error: billingError } = await api.from('api_usage_log').select();

      const billingData = rawBillingData ? rawBillingData.filter((b: any) => userIds.includes(b.user_id)) : [];

      if (billingError) {
        console.error('Error fetching billing data:', billingError);
      }

      console.log('Billing records found:', billingData?.length || 0);

      // Step 4: Process each user with comprehensive metrics
      console.log('Step 4: Processing user metrics...');

      const combinedData: UserUsageData[] = usersWithMetrics.map((user) => {
        // Initialize with default values
        const userData: UserUsageData = {
          ...user,
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
        };

        // Process analysis data for this user
        const userAnalyses = analysisData?.filter(a => a.user_id === user.id) || [];
        userData.totalAnalyses = userAnalyses.length;

        // Count today's analyses
        userData.todayAnalyses = userAnalyses.filter(a =>
          a.created_at.startsWith(today)
        ).length;

        // Find last activity
        if (userAnalyses.length > 0) {
          const sortedAnalyses = userAnalyses.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          userData.lastActive = sortedAnalyses[0].created_at;
          userData.lastActivityType = 'completed analysis';
        }

        // Process weekly analyses
        userAnalyses.forEach(analysis => {
          const analysisDate = analysis.created_at.split('T')[0];
          const weekIndex = userData.weeklyAnalyses.findIndex(w => w.date === analysisDate);
          if (weekIndex >= 0) {
            userData.weeklyAnalyses[weekIndex].count++;
          }
        });

        // Process billing data for this user
        const userBilling = billingData?.filter(b => b.user_id === user.id) || [];

        userData.totalBilledUsage = userBilling.reduce((sum, b) => sum + (b.usage_count || 0), 0);
        userData.todayBilledUsage = userBilling
          .filter(b => b.usage_date === today)
          .reduce((sum, b) => sum + (b.usage_count || 0), 0);

        return userData;
      });

      console.log('Final processed data:', combinedData.length, 'users');

      // Step 5: Calculate global metrics
      const totalUsers = combinedData.length;
      const totalActiveUsers = combinedData.filter(user =>
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      ).length;
      const usersAnalysesToday = combinedData.filter(user => user.todayAnalyses > 0).length;
      const totalSubscribedUsers = combinedData.filter(user => user.is_subscribed).length;
      const totalAnalysesAll = combinedData.reduce((sum, user) => sum + user.totalAnalyses, 0);
      const averageAnalysesPerUser = totalUsers > 0 ? totalAnalysesAll / totalUsers : 0;

      const calculatedMetrics = {
        totalUsers,
        totalActiveUsers,
        usersAnalysesToday,
        totalSubscribedUsers,
        averageAnalysesPerUser
      };

      console.log('Calculated metrics:', calculatedMetrics);

      // Step 6: Set state
      console.log('Setting state with', combinedData.length, 'users');
      setAllUsers(combinedData);
      setMetrics(calculatedMetrics);
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
