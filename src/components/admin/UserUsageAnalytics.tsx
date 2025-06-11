
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserUsageData {
  id: string;
  email: string;
  full_name: string | null;
  is_subscribed: boolean;
  created_at: string;
  todayUsage: number;
  totalUsage: number;
  lastActive: string | null;
}

const UserUsageAnalytics = () => {
  const [users, setUsers] = useState<UserUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchUserUsage = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, is_subscribed, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get today's usage for all users
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsageData, error: todayUsageError } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count')
        .eq('usage_date', today);

      if (todayUsageError) throw todayUsageError;

      // Get total usage for all users
      const { data: totalUsageData, error: totalUsageError } = await supabase
        .from('api_usage_log')
        .select('user_id, usage_count');

      if (totalUsageError) throw totalUsageError;

      // Get last activity (recent food entries or pending analyses)
      const { data: lastActivityData, error: lastActivityError } = await supabase
        .from('pending_analyses')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (lastActivityError) throw lastActivityError;

      // Combine the data
      const combinedData: UserUsageData[] = usersData?.map(user => {
        const todayUsage = todayUsageData?.find(u => u.user_id === user.id)?.usage_count || 0;
        const totalUsage = totalUsageData?.filter(u => u.user_id === user.id)
          .reduce((sum, u) => sum + u.usage_count, 0) || 0;
        const lastActivity = lastActivityData?.find(a => a.user_id === user.id)?.created_at || null;

        return {
          ...user,
          todayUsage,
          totalUsage,
          lastActive: lastActivity
        };
      }) || [];

      setUsers(combinedData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching user usage:', error);
      toast.error('Failed to load user usage data');
    } finally {
      setLoading(false);
    }
  };

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

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { status: 'active today', color: 'bg-green-100 text-green-800' };
    if (daysSince <= 3) return { status: 'recent', color: 'bg-blue-100 text-blue-800' };
    if (daysSince <= 7) return { status: 'this week', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
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
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                  const activityStatus = getActivityStatus(user.lastActive);
                  return (
                    <TableRow key={user.id}>
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
                        <span className="text-sm">{formatDate(user.lastActive)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={activityStatus.color}>
                          {activityStatus.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
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
