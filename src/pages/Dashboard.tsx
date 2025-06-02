import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, Dumbbell, TrendingUp, Plus, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { AnalysisStatusIndicator } from "@/components/dashboard/AnalysisStatusIndicator";
import { usePendingAnalyses } from "@/hooks/usePendingAnalyses";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AutoRefreshIndicator } from "@/components/dashboard/AutoRefreshIndicator";

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

  const { 
    pendingAnalyses, 
    loading: pendingLoading, 
    refetch: refetchPending, 
    forceRefresh,
    isRefreshing: autoRefreshing,
    isVisible,
    connectionStatus,
    lastRefresh,
    performRefresh,
    autoRefreshEnabled
  } = usePendingAnalyses(user?.id);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { count: foodCount, error: foodError } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (foodError) throw foodError;

      const { count: receiptsCount, error: receiptsError } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (receiptsError) throw receiptsError;

      const { count: workoutsCount, error: workoutsError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (workoutsError) throw workoutsError;

      const { data: foodEntries, error: caloriesError } = await supabase
        .from('food_entries')
        .select('calories')
        .eq('user_id', user.id);

      if (caloriesError) throw caloriesError;

      const totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabase
        .from('api_usage_log')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      const usageCount = usage?.usage_count || 0;

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
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Utensils,
      title: "View Food Entries",
      description: "See your nutrition analysis",
      action: () => navigate("/food"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: Receipt,
      title: "View Receipts",
      description: "Track your spending",
      action: () => navigate("/receipts"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: Dumbbell,
      title: "View Workouts",
      description: "Check your fitness progress",
      action: () => navigate("/workouts"),
      color: "bg-orange-500 hover:bg-orange-600"
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
      <div className={`space-y-4 lg:space-y-6 ${isMobile ? 'pb-20' : 'pb-6'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Dashboard</h1>
            <p className="text-sm text-gray-600 sm:text-base">Welcome back! Here's your health overview.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <AnalysisStatusIndicator 
              analyses={pendingAnalyses} 
              onRetry={refetchPending}
            />
            <AutoRefreshIndicator
              isRefreshing={autoRefreshing || refreshing}
              isVisible={isVisible}
              connectionStatus={connectionStatus}
              lastRefresh={lastRefresh}
              onManualRefresh={handleManualRefresh}
              autoRefreshEnabled={autoRefreshEnabled}
            />
            <NotificationBell />
          </div>
        </div>

        {/* Usage Status - Responsive */}
        {!stats.isSubscribed && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    Today's Usage
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {`${stats.usageToday}/2 free analyses used`}
                  </CardDescription>
                </div>
                <Badge variant={stats.usageToday >= 2 ? "destructive" : "secondary"} className="self-start sm:self-center">
                  {stats.usageToday >= 2 ? "Limit Reached" : "Free Trial"}
                </Badge>
              </div>
            </CardHeader>
            {stats.usageToday >= 2 && (
              <CardContent className="pt-0">
                <Button onClick={() => navigate("/billing")} className="w-full sm:w-auto">
                  Upgrade to Pro for Unlimited Access
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Responsive Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Food Entries</CardTitle>
              <Utensils className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.foodEntries}</div>
              <p className="text-xs text-muted-foreground">Total analyzed meals</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Receipts</CardTitle>
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.receipts}</div>
              <p className="text-xs text-muted-foreground">Expenses tracked</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.workouts}</div>
              <p className="text-xs text-muted-foreground">Sessions logged</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Calories</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From food entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Responsive Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={action.action}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white transition-colors`}>
                      <action.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-none">{action.description}</p>
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
