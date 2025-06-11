
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Calendar, ChevronDown, ChevronRight, Activity, UserCheck, CreditCard, BarChart3, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { StandardFilters } from "@/components/common/StandardFilters";

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
  totalUsers: number;
  totalActiveUsers: number;
  usersAnalysesToday: number;
  totalSubscribedUsers: number;
  averageAnalysesPerUser: number;
}

const UserUsageAnalytics = () => {
  const [allUsers, setAllUsers] = useState<UserUsageData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserUsageData[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalUsers: 0,
    totalActiveUsers: 0,
    usersAnalysesToday: 0,
    totalSubscribedUsers: 0,
    averageAnalysesPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalAnalyses-desc");

  const fetchUserUsage = async () => {
    try {
      setLoading(true);
      
      console.log('UserUsageAnalytics: Starting data fetch...');
      
      // Get ALL users with their basic info - this is our primary source
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, is_subscribed, created_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log('UserUsageAnalytics: Raw users data:', usersData);

      if (!usersData || usersData.length === 0) {
        console.log('UserUsageAnalytics: No users found in database');
        setAllUsers([]);
        setFilteredUsers([]);
        return;
      }

      console.log('UserUsageAnalytics: Found', usersData.length, 'users in database');

      const userIds = usersData.map(u => u.id);
      console.log('UserUsageAnalytics: User IDs:', userIds);

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

      console.log('UserUsageAnalytics: API costs data:', allApiCostsData?.length || 0, 'records');

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

  // Filter and sort users whenever filters change
  useEffect(() => {
    let filtered = [...allUsers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active only filter
    if (showActiveOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(user => 
        user.lastActive && new Date(user.lastActive) >= thirtyDaysAgo
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalAnalyses-desc':
          return b.totalAnalyses - a.totalAnalyses;
        case 'totalAnalyses-asc':
          return a.totalAnalyses - b.totalAnalyses;
        case 'todayAnalyses-desc':
          return b.todayAnalyses - a.todayAnalyses;
        case 'email-asc':
          return a.email.localeCompare(b.email);
        case 'email-desc':
          return b.email.localeCompare(a.email);
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return b.totalAnalyses - a.totalAnalyses;
      }
    });

    setFilteredUsers(filtered);
    console.log('UserUsageAnalytics: Filtered users:', filtered.length, 'from', allUsers.length, 'total');
  }, [allUsers, searchTerm, showActiveOnly, sortBy]);

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

  const sortOptions = [
    { value: "totalAnalyses-desc", label: "Total Analyses (High to Low)" },
    { value: "totalAnalyses-asc", label: "Total Analyses (Low to High)" },
    { value: "todayAnalyses-desc", label: "Today's Analyses (High to Low)" },
    { value: "email-asc", label: "Email (A-Z)" },
    { value: "email-desc", label: "Email (Z-A)" },
    { value: "created-desc", label: "Newest Users" },
    { value: "created-asc", label: "Oldest Users" },
  ];

  const customFilters = (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <Button
          variant={showActiveOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showActiveOnly ? "Active Users Only" : "All Users"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* User Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

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

      {/* Filters */}
      <StandardFilters
        searchPlaceholder="Search users by email or name..."
        sortOptions={sortOptions}
        customFilters={customFilters}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        totalCount={allUsers.length}
        filteredCount={filteredUsers.length}
        hasActiveFilters={showActiveOnly || searchTerm.length > 0}
        onClearFilters={() => {
          setSearchTerm("");
          setShowActiveOnly(false);
          setSortBy("totalAnalyses-desc");
        }}
      />

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
                  {filteredUsers.map((user) => {
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
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  {showActiveOnly ? 'No active users found' : 'No users found'}
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
