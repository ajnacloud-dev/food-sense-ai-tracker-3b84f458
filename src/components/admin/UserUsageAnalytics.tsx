
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Calendar, ChevronDown, ChevronRight, Activity, UserCheck, CreditCard, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface UserUsageData {
  id: string;
  email: string;
  full_name: string | null;
  is_subscribed: boolean;
  created_at: string;
  todayAnalyses: number;
  totalAnalyses: number;
  todayBilledUsage: number;
  totalBilledUsage: number;
  lastActive: string | null;
  lastActivityType: string | null;
  weeklyAnalyses: { date: string; count: number }[];
}

interface UserMetrics {
  totalActiveUsers: number;
  usersAnalysesToday: number;
  totalSubscribedUsers: number;
  averageAnalysesPerUser: number;
}

const UserUsageAnalytics = () => {
  const [users, setUsers] = useState<UserUsageData[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalActiveUsers: 0,
    usersAnalysesToday: 0,
    totalSubscribedUsers: 0,
    averageAnalysesPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const fetchUserUsage = async () => {
    try {
      setLoading(true);
      
      // Get all users with their basic info - this ensures we show ALL users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, is_subscribed, created_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log('UserUsageAnalytics: Found', usersData?.length || 0, 'users in database');

      if (!usersData || usersData.length === 0) {
        console.log('UserUsageAnalytics: No users found');
        setUsers([]);
        return;
      }

      const userIds = usersData.map(u => u.id);

      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];

      // Get analyses data from api_costs table (primary source - matches dashboard)
      const { data: allApiCostsData, error: apiCostsError } = await supabase
        .from('api_costs')
        .select('user_id, created_at, function_name')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (apiCostsError) {
        console.error('Error fetching api_costs:', apiCostsError);
      }

      // Get billing usage from api_usage_log (secondary data)
      const { data: todayBilledData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count')
        .eq('usage_date', today)
        .in('user_id', userIds);

      const { data: totalBilledData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count')
        .in('user_id', userIds);

      // Get pending_analyses for activity status detection only
      const { data: pendingAnalysesData } = await supabase
        .from('pending_analyses')
        .select('user_id, created_at, status')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Get last 7 days for weekly breakdown from api_costs
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const { data: weeklyApiCostsData } = await supabase
        .from('api_costs')
        .select('user_id, created_at')
        .gte('created_at', weekAgoStr)
        .in('user_id', userIds);

      // Process the data - SHOW ALL USERS
      const combinedData: UserUsageData[] = usersData.map(user => {
        // Get user's analyses data from api_costs (primary source)
        const userApiCosts = allApiCostsData?.filter(a => a.user_id === user.id) || [];
        
        // Count today's analyses from api_costs
        const todayAnalyses = userApiCosts.filter(a => 
          a.created_at.startsWith(today)
        ).length;

        // Count total analyses from api_costs
        const totalAnalyses = userApiCosts.length;

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

      // Sort by total analyses descending, but keep all users
      combinedData.sort((a, b) => b.totalAnalyses - a.totalAnalyses);
      setUsers(combinedData);

      // Calculate metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const totalActiveUsers = combinedData.filter(user => 
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      ).length;
      
      const usersAnalysesToday = combinedData.filter(user => user.todayAnalyses > 0).length;
      const totalSubscribedUsers = combinedData.filter(user => user.is_subscribed).length;
      const totalAnalysesAll = combinedData.reduce((sum, user) => sum + user.totalAnalyses, 0);
      const averageAnalysesPerUser = combinedData.length > 0 ? totalAnalysesAll / combinedData.length : 0;

      setMetrics({
        totalActiveUsers,
        usersAnalysesToday,
        totalSubscribedUsers,
        averageAnalysesPerUser
      });

      console.log('UserUsageAnalytics: Processed data for', combinedData.length, 'users');
      console.log('Total analyses across all users:', totalAnalysesAll);

    } catch (error) {
      console.error('Error fetching user usage:', error);
      toast.error('Failed to load user usage data');
    } finally {
      setLoading(false);
    }
  };

  const { isRefreshing, lastRefresh } = useAutoRefresh({
    enabled: true,
    interval: 30000, // 30 seconds
    onRefresh: fetchUserUsage
  });

  useEffect(() => {
    fetchUserUsage();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityStatus = (lastActive: string | null, todayAnalyses: number) => {
    if (!lastActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0 && todayAnalyses > 0) return { status: 'active today', color: 'bg-green-100 text-green-800' };
    if (daysSince === 0) return { status: 'seen today', color: 'bg-blue-100 text-blue-800' };
    if (daysSince <= 3) return { status: 'recent', color: 'bg-yellow-100 text-yellow-800' };
    if (daysSince <= 7) return { status: 'this week', color: 'bg-orange-100 text-orange-800' };
    return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* User Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActiveUsers}</div>
            <p className="text-xs text-muted-foreground">Users with activity in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.usersAnalysesToday}</div>
            <p className="text-xs text-muted-foreground">Users with analyses today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubscribedUsers}</div>
            <p className="text-xs text-muted-foreground">Pro subscription users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageAnalysesPerUser.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Per user (all time)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Usage Analytics
              </CardTitle>
              <CardDescription>
                Monitor user activity and analysis usage across the platform
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserUsage}
                disabled={loading || isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Today's Analyses</TableHead>
                    <TableHead>Total Analyses</TableHead>
                    <TableHead>Billed Usage</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const activityStatus = getActivityStatus(user.lastActive, user.todayAnalyses);
                    const isExpanded = expandedUsers.has(user.id);
                    
                    return (
                      <>
                        <TableRow key={user.id} className="cursor-pointer" onClick={() => toggleUserExpansion(user.id)}>
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {user.is_subscribed ? 'Pro' : 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.todayAnalyses}</span>
                              {!user.is_subscribed && user.todayAnalyses >= 2 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Limit Reached</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{user.totalAnalyses}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Today: {user.todayBilledUsage}</div>
                              <div className="text-gray-500">Total: {user.totalBilledUsage}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="text-sm">{formatDate(user.lastActive)}</span>
                              {user.lastActivityType && (
                                <div className="text-xs text-gray-400 capitalize">
                                  {user.lastActivityType}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={activityStatus.color}>
                              {activityStatus.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50">
                              <div className="p-4">
                                <h4 className="font-medium mb-2">7-Day Analysis Breakdown</h4>
                                <div className="grid grid-cols-7 gap-2">
                                  {user.weeklyAnalyses.map((day, index) => (
                                    <div key={index} className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                      </div>
                                      <div className={`text-sm font-medium px-2 py-1 rounded ${
                                        day.count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {day.count}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500">
                                  <div>
                                    <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                  <div>
                                    <strong>Billing vs Analyses:</strong> {user.totalBilledUsage} billed / {user.totalAnalyses} analyses
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserUsageAnalytics;
