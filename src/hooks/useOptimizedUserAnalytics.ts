
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
      console.log('🔍 OptimizedUserAnalytics: Starting comprehensive data fetch...');
      
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      // Step 1: Get ALL users first - this is critical
      console.log('📊 Step 1: Fetching all users...');
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
        console.error('❌ Error fetching users:', usersError);
        throw usersError;
      }

      console.log('✅ Raw users fetched:', usersWithMetrics?.length || 0);
      console.log('👥 User emails:', usersWithMetrics?.map(u => u.email) || []);

      if (!usersWithMetrics || usersWithMetrics.length === 0) {
        console.log('⚠️ No users found in database');
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
      console.log('🔑 User IDs to fetch data for:', userIds.length, userIds);

      // Step 2: Get analysis data for all users
      console.log('📊 Step 2: Fetching analysis data...');
      const { data: analysisData, error: analysisError } = await supabase
        .from('api_costs')
        .select('user_id, created_at')
        .in('user_id', userIds);

      if (analysisError) {
        console.error('❌ Error fetching analysis data:', analysisError);
      }

      console.log('📈 Analysis records found:', analysisData?.length || 0);

      // Step 3: Get billing data
      console.log('📊 Step 3: Fetching billing data...');
      const { data: billingData, error: billingError } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_date, usage_count')
        .in('user_id', userIds);

      if (billingError) {
        console.error('❌ Error fetching billing data:', billingError);
      }

      console.log('💰 Billing records found:', billingData?.length || 0);

      // Step 4: Process each user with comprehensive metrics
      console.log('📊 Step 4: Processing user metrics...');
      
      const combinedData: UserUsageData[] = usersWithMetrics.map((user, index) => {
        console.log(`🔄 Processing user ${index + 1}/${usersWithMetrics.length}: ${user.email} (ID: ${user.id})`);
        
        // Initialize with default values - ENSURE ALL USERS GET PROCESSED
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

        console.log(`✅ User ${user.email}: ${userData.totalAnalyses} analyses, ${userData.todayAnalyses} today, ID: ${user.id}`);
        
        return userData;
      });

      console.log('🎯 Final processed data:', combinedData.length, 'users');
      console.log('📋 Users with data (detailed):', combinedData.map(u => ({
        email: u.email,
        id: u.id,
        total: u.totalAnalyses,
        today: u.todayAnalyses,
        subscribed: u.is_subscribed
      })));

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

      console.log('📊 Calculated metrics:', calculatedMetrics);

      // Step 6: Set state - CRITICAL: Make sure we set ALL users
      console.log('💾 Setting state with', combinedData.length, 'users');
      setAllUsers(combinedData);
      setMetrics(calculatedMetrics);
      setLastFetch(new Date());
      
      // VERIFICATION LOG: Check what we actually set
      console.log('✅ OptimizedUserAnalytics: Data fetch completed successfully');
      console.log('🎯 Final state will contain - Users:', combinedData.length, 'Metrics:', calculatedMetrics);
      console.log('📝 All user emails being set:', combinedData.map(u => u.email));

    } catch (error) {
      console.error('❌ Error fetching optimized user data:', error);
      toast.error('Failed to load user analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchOptimizedUserData();
  }, [fetchOptimizedUserData]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 OptimizedUserAnalytics: allUsers state updated to:', allUsers.length, 'users');
    console.log('👥 Current users in state:', allUsers.map(u => u.email));
  }, [allUsers]);

  return {
    allUsers,
    metrics,
    loading,
    lastFetch,
    refetch: fetchOptimizedUserData
  };
};
