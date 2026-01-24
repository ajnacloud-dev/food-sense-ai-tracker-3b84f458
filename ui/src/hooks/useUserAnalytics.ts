
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UserUsageData, UserMetrics } from "@/types/userAnalytics";

export const useUserAnalytics = () => {
  const [allUsers, setAllUsers] = useState<UserUsageData[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalUsers: 0,
    totalActiveUsers: 0,
    usersAnalysesToday: 0,
    totalSubscribedUsers: 0,
    averageAnalysesPerUser: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchUserUsage = async () => {
    try {
      setLoading(true);

      console.log('UserUsageAnalytics: Starting data fetch...');

      // Get ALL users with their basic info - this is our primary source
      // Get ALL users with their basic info - this is our primary source
      const { data: usersData, error: usersError } = await api.from('users').select();

      // Manual Sort
      if (usersData) {
        usersData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log('UserUsageAnalytics: Raw users data:', usersData);

      if (!usersData || usersData.length === 0) {
        console.log('UserUsageAnalytics: No users found in database');
        setAllUsers([]);
        return;
      }

      console.log('UserUsageAnalytics: Found', usersData.length, 'users in database');

      const userIds = usersData.map(u => u.id);
      console.log('UserUsageAnalytics: User IDs:', userIds);

      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];

      // Get analyses data from api_costs table (primary source - matches dashboard)
      // Get analyses data from api_costs table
      const { data: allApiCostsRaw, error: apiCostsError } = await api.from('api_costs').select();

      let allApiCostsData: any[] = [];
      if (allApiCostsRaw) {
        allApiCostsData = allApiCostsRaw.filter((c: any) => userIds.includes(c.user_id));
        allApiCostsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (apiCostsError) {
        console.error('Error fetching api_costs:', apiCostsError);
      }

      console.log('UserUsageAnalytics: API costs data:', allApiCostsData?.length || 0, 'records');

      // Get billing usage from api_usage_log (secondary data)
      // Get billing usage
      const { data: allUsageLog } = await api.from('api_usage_log').select();

      const todayBilledData = allUsageLog
        ? allUsageLog.filter((u: any) => u.usage_date === today && userIds.includes(u.user_id))
        : [];

      const totalBilledData = allUsageLog
        ? allUsageLog.filter((u: any) => userIds.includes(u.user_id))
        : [];

      // Get pending_analyses for activity status detection only
      // Get pending_analyses
      const { data: allPending } = await api.from('pending_analyses').select();
      const pendingAnalysesData = allPending
        ? allPending.filter((p: any) => userIds.includes(p.user_id))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

      // Get last 7 days for weekly breakdown from api_costs
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Get last 7 days from already fetched api costs
      const weeklyApiCostsData = allApiCostsData.filter((a: any) => a.created_at >= weekAgoStr);

      // Process the data - SHOW ALL USERS (this is the key fix)
      const combinedData: UserUsageData[] = usersData.map(user => {
        console.log('UserUsageAnalytics: Processing user:', user.email);

        // Get user's analyses data from api_costs (primary source)
        const userApiCosts = allApiCostsData?.filter(a => a.user_id === user.id) || [];

        // Count today's analyses from api_costs
        const todayAnalyses = userApiCosts.filter(a =>
          a.created_at.startsWith(today)
        ).length;

        // Count total analyses from api_costs
        const totalAnalyses = userApiCosts.length;

        console.log('UserUsageAnalytics: User', user.email, 'has', totalAnalyses, 'total analyses,', todayAnalyses, 'today');

        // Get billing usage from api_usage_log
        const todayBilledUsage = todayBilledData
          ?.filter(u => u.user_id === user.id)
          .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0;

        const totalBilledUsage = totalBilledData
          ?.filter(u => u.user_id === user.id)
          .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0;

        // Get weekly analyses breakdown from api_costs
        const userWeeklyData = weeklyApiCostsData?.filter(a => a.user_id === user.id) || [];
        const weeklyAnalyses = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayCount = userWeeklyData.filter(a =>
            a.created_at.startsWith(dateStr)
          ).length;
          weeklyAnalyses.push({ date: dateStr, count: dayCount });
        }

        // Get last activity - try api_costs first, then pending_analyses
        const lastApiCost = userApiCosts[0]; // Already sorted by created_at desc
        const userPendingAnalyses = pendingAnalysesData?.filter(a => a.user_id === user.id) || [];
        const lastPendingAnalysis = userPendingAnalyses[0];

        // Use the most recent activity from either source
        let lastActive = null;
        let lastActivityType = null;

        if (lastApiCost && lastPendingAnalysis) {
          // Compare dates and use the most recent
          const apiCostDate = new Date(lastApiCost.created_at);
          const pendingDate = new Date(lastPendingAnalysis.created_at);
          if (apiCostDate >= pendingDate) {
            lastActive = lastApiCost.created_at;
            lastActivityType = 'completed analysis';
          } else {
            lastActive = lastPendingAnalysis.created_at;
            lastActivityType = 'analysis activity';
          }
        } else if (lastApiCost) {
          lastActive = lastApiCost.created_at;
          lastActivityType = 'completed analysis';
        } else if (lastPendingAnalysis) {
          lastActive = lastPendingAnalysis.created_at;
          lastActivityType = 'analysis activity';
        }

        return {
          ...user,
          todayAnalyses,
          totalAnalyses,
          todayBilledUsage,
          totalBilledUsage,
          lastActive,
          lastActivityType,
          weeklyAnalyses
        };
      });

      console.log('UserUsageAnalytics: Final processed data:', combinedData.length, 'users');

      // Set all users first
      setAllUsers(combinedData);

      // Calculate metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalUsers = combinedData.length;
      const totalActiveUsers = combinedData.filter(user =>
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      ).length;

      const usersAnalysesToday = combinedData.filter(user => user.todayAnalyses > 0).length;
      const totalSubscribedUsers = combinedData.filter(user => user.is_subscribed).length;
      const totalAnalysesAll = combinedData.reduce((sum, user) => sum + user.totalAnalyses, 0);
      const averageAnalysesPerUser = totalUsers > 0 ? totalAnalysesAll / totalUsers : 0;

      setMetrics({
        totalUsers,
        totalActiveUsers,
        usersAnalysesToday,
        totalSubscribedUsers,
        averageAnalysesPerUser
      });

      console.log('UserUsageAnalytics: Metrics calculated:', {
        totalUsers,
        totalActiveUsers,
        usersAnalysesToday,
        totalSubscribedUsers,
        averageAnalysesPerUser
      });

    } catch (error) {
      console.error('Error fetching user usage:', error);
      toast.error('Failed to load user usage data');
    } finally {
      setLoading(false);
    }
  };

  return {
    allUsers,
    metrics,
    loading,
    fetchUserUsage,
    refetch: fetchUserUsage
  };
};
