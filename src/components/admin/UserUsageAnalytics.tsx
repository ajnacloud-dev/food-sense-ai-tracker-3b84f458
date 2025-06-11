
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface UserUsageData {
  id: string;
  email: string;
  full_name: string | null;
  is_subscribed: boolean;
  created_at: string;
  todayUsage: number;
  totalUsage: number;
  lastActive: string | null;
  lastActivityType: string | null;
  weeklyUsage: { date: string; count: number }[];
}

const UserUsageAnalytics = () => {
  const [users, setUsers] = useState<UserUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const fetchUserUsage = async () => {
    try {
      setLoading(true);
      
      // Get all users with their basic info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, is_subscribed, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        return;
      }

      // Get today's usage for all users
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsageData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count')
        .eq('usage_date', today);

      // Get total usage for all users
      const { data: totalUsageData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count');

      // Get last 7 days usage for weekly breakdown
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weeklyUsageData } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_date, usage_count')
        .gte('usage_date', weekAgo.toISOString().split('T')[0]);

      // Get last activity from multiple sources
      const userIds = usersData.map(u => u.id);
      
      // Check food entries
      const { data: foodActivity } = await supabase
        .from('food_entries')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Check pending analyses
      const { data: analysisActivity } = await supabase
        .from('pending_analyses')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Check receipts
      const { data: receiptActivity } = await supabase
        .from('receipts')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Check workouts
      const { data: workoutActivity } = await supabase
        .from('workouts')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Combine all activity data
      const allActivities = [
        ...(foodActivity?.map(a => ({ ...a, type: 'food_entry' })) || []),
        ...(analysisActivity?.map(a => ({ ...a, type: 'analysis' })) || []),
        ...(receiptActivity?.map(a => ({ ...a, type: 'receipt' })) || []),
        ...(workoutActivity?.map(a => ({ ...a, type: 'workout' })) || [])
      ];

      // Find last activity per user
      const lastActivities = new Map();
      allActivities.forEach(activity => {
        const existing = lastActivities.get(activity.user_id);
        if (!existing || new Date(activity.created_at) > new Date(existing.created_at)) {
          lastActivities.set(activity.user_id, activity);
        }
      });

      // Combine all the data
      const combinedData: UserUsageData[] = usersData.map(user => {
        // Calculate today's usage
        const todayUsage = todayUsageData
          ?.filter(u => u.user_id === user.id)
          .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0;

        // Calculate total usage
        const totalUsage = totalUsageData
          ?.filter(u => u.user_id === user.id)
          .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0;

        // Get weekly usage breakdown
        const userWeeklyData = weeklyUsageData?.filter(u => u.user_id === user.id) || [];
        const weeklyUsage = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayUsage = userWeeklyData
            .filter(u => u.usage_date === dateStr)
            .reduce((sum, u) => sum + (u.usage_count || 0), 0);
          weeklyUsage.push({ date: dateStr, count: dayUsage });
        }

        // Get last activity
        const lastActivity = lastActivities.get(user.id);

        return {
          ...user,
          todayUsage,
          totalUsage,
          lastActive: lastActivity?.created_at || null,
          lastActivityType: lastActivity?.type || null,
          weeklyUsage
        };
      });

      // Sort by total usage descending
      combinedData.sort((a, b) => b.totalUsage - a.totalUsage);
      setUsers(combinedData);

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

  const getActivityStatus = (lastActive: string | null, todayUsage: number) => {
    if (!lastActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0 && todayUsage > 0) return { status: 'active today', color: 'bg-green-100 text-green-800' };
    if (daysSince === 0) return { status: 'seen today', color: 'bg-blue-100 text-blue-800' };
    if (daysSince <= 3) return { status: 'recent', color: 'bg-yellow-100 text-yellow-800' };
    if (daysSince <= 7) return { status: 'this week', color: 'bg-orange-100 text-orange-800' };
    return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
  };

  const formatActivityType = (type: string | null) => {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Usage Analytics
            </CardTitle>
            <CardDescription>
              Monitor user activity and API usage across the platform
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
                  <TableHead>Today's Usage</TableHead>
                  <TableHead>Total Usage</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const activityStatus = getActivityStatus(user.lastActive, user.todayUsage);
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
                            <span className="font-medium">{user.todayUsage}</span>
                            {!user.is_subscribed && user.todayUsage >= 2 && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Limit Reached</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.totalUsage}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{formatDate(user.lastActive)}</span>
                            {user.lastActivityType && (
                              <div className="text-xs text-gray-400">
                                {formatActivityType(user.lastActivityType)}
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
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4">
                              <h4 className="font-medium mb-2">7-Day Usage Breakdown</h4>
                              <div className="grid grid-cols-7 gap-2">
                                {user.weeklyUsage.map((day, index) => (
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
                              <div className="mt-3 text-xs text-gray-500">
                                Joined: {new Date(user.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
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
  );
};

export default UserUsageAnalytics;
