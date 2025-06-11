
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, Users, Activity, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PromptManager from "./PromptManager";
import CostAnalytics from "./CostAnalytics";
import UserUsageAnalytics from "./UserUsageAnalytics";

interface AdminStats {
  totalUsers: number;
  totalCosts: number;
  todayCosts: number;
  totalAnalyses: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCosts: 0,
    todayCosts: 0,
    totalAnalyses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Optimized queries - fetch only what we need for overview stats
      const today = new Date().toISOString().split('T')[0];

      // Get user count efficiently
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        console.error('Error fetching user count:', userError);
        throw userError;
      }

      // Get cost data efficiently with aggregation
      const { data: costData, error: costError } = await supabase
        .from('api_costs')
        .select('cost_usd, created_at');

      if (costError) {
        console.error('Error fetching costs:', costError);
        throw costError;
      }

      const totalCosts = costData?.reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;
      const todayCosts = costData?.filter(cost => 
        cost.created_at.startsWith(today)
      ).reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalCosts,
        todayCosts,
        totalAnalyses: costData?.length || 0
      });

      console.log('AdminDashboard: Stats loaded efficiently:', {
        totalUsers: userCount,
        totalCosts,
        todayCosts,
        totalAnalyses: costData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage prompts, monitor costs, and analyze usage</p>
        </div>
        <Button 
          onClick={() => navigate("/admin/test-workflow")}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test Workflow
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCosts)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayCosts)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Analytics
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Prompt Management
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserUsageAnalytics />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptManager />
        </TabsContent>

        <TabsContent value="costs">
          <CostAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
