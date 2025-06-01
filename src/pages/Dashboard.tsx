
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, Dumbbell, TrendingUp, Plus, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { PendingAnalysesCard } from "@/components/capture/PendingAnalysesCard";
import { usePendingAnalyses } from "@/hooks/usePendingAnalyses";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    foodEntries: 0,
    receipts: 0,
    workouts: 0,
    totalCalories: 0,
    usageToday: 0,
    isSubscribed: false,
    userRole: 'user'
  });

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  // Auto-refresh when navigating back from capture
  useEffect(() => {
    const state = location.state as { shouldRefresh?: boolean } | null;
    if (state?.shouldRefresh && user) {
      console.log('Auto-refreshing dashboard data after capture');
      handleManualRefresh();
    }
  }, [location.state, user]);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data');
    }
  };

  const { pendingAnalyses, loading: pendingLoading, refetch: refetchPending, forceRefresh } = usePendingAnalyses(user?.id);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch food entries count
      const { count: foodCount, error: foodError } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (foodError) throw foodError;

      // Fetch receipts count
      const { count: receiptsCount, error: receiptsError } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (receiptsError) throw receiptsError;

      // Fetch workouts count
      const { count: workoutsCount, error: workoutsError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (workoutsError) throw workoutsError;

      // Fetch total calories from food entries
      const { data: foodEntries, error: caloriesError } = await supabase
        .from('food_entries')
        .select('calories')
        .eq('user_id', user.id);

      if (caloriesError) throw caloriesError;

      const totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

      // Fetch today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabase
        .from('api_usage_log')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      // Usage error is expected if no entry exists for today
      const usageCount = usage?.usage_count || 0;

      // Fetch user subscription status and role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_subscribed, role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setStats({
        foodEntries: foodCount || 0,
        receipts: receiptsCount || 0,
        workouts: workoutsCount || 0,
        totalCalories,
        usageToday: usageCount,
        isSubscribed: userData?.is_subscribed || false,
        userRole: userData?.role || 'user'
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        forceRefresh()
      ]);
      console.log('Dashboard manually refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter out inconsistent analyses from pending count
  const actualPendingAnalyses = pendingAnalyses.filter(a => 
    (a.status === 'pending' && !a.completed_at) || 
    a.status === 'processing'
  );

  const quickActions = [
    {
      icon: Plus,
      title: "Quick Capture",
      description: "Upload food, receipt, or workout",
      action: () => navigate("/capture"),
      color: "bg-blue-500"
    },
    {
      icon: Utensils,
      title: "View Food Entries",
      description: "See your nutrition analysis",
      action: () => navigate("/food"),
      color: "bg-green-500"
    },
    {
      icon: Receipt,
      title: "View Receipts",
      description: "Track your spending",
      action: () => navigate("/receipts"),
      color: "bg-purple-500"
    },
    {
      icon: Dumbbell,
      title: "View Workouts",
      description: "Check your fitness progress",
      action: () => navigate("/workouts"),
      color: "bg-orange-500"
    }
  ];

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardStats}>Retry</Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className={`space-y-6 ${isMobile ? 'pb-20' : 'pb-6'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your health overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <NotificationBell />
          </div>
        </div>

        {/* Pending Analyses */}
        {!pendingLoading && pendingAnalyses.length > 0 && (
          <PendingAnalysesCard 
            analyses={pendingAnalyses} 
            onRetry={refetchPending}
          />
        )}

        {/* Usage Status - Only show for non-subscribed users */}
        {!stats.isSubscribed && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Today's Usage
                  </CardTitle>
                  <CardDescription>
                    {`${stats.usageToday}/2 free analyses used`}
                  </CardDescription>
                </div>
                <Badge variant={stats.usageToday >= 2 ? "destructive" : "secondary"}>
                  {stats.usageToday >= 2 ? "Limit Reached" : "Free Trial"}
                </Badge>
              </div>
            </CardHeader>
            {stats.usageToday >= 2 && (
              <CardContent>
                <Button onClick={() => navigate("/billing")} className="w-full">
                  Upgrade to Pro for Unlimited Access
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Food Entries</CardTitle>
              <Utensils className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.foodEntries}</div>
              <p className="text-xs text-muted-foreground">Total analyzed meals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receipts</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.receipts}</div>
              <p className="text-xs text-muted-foreground">Expenses tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workouts}</div>
              <p className="text-xs text-muted-foreground">Sessions logged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From food entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={action.action}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Dashboard;
