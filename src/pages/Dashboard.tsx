
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, Dumbbell, TrendingUp, Plus, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    foodEntries: 0,
    receipts: 0,
    workouts: 0,
    totalCalories: 0,
    usageToday: 0,
    isSubscribed: false,
    userRole: 'user'
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch food entries count
    const { count: foodCount } = await supabase
      .from('food_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch receipts count
    const { count: receiptsCount } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch workouts count
    const { count: workoutsCount } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch total calories from food entries
    const { data: foodEntries } = await supabase
      .from('food_entries')
      .select('calories')
      .eq('user_id', user.id);

    const totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

    // Fetch today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('api_usage_log')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single();

    // Fetch user subscription status and role
    const { data: userData } = await supabase
      .from('users')
      .select('is_subscribed, role')
      .eq('id', user.id)
      .single();

    setStats({
      foodEntries: foodCount || 0,
      receipts: receiptsCount || 0,
      workouts: workoutsCount || 0,
      totalCalories,
      usageToday: usage?.usage_count || 0,
      isSubscribed: userData?.is_subscribed || false,
      userRole: userData?.role || 'user'
    });
  };

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

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your health overview.</p>
        </div>

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
