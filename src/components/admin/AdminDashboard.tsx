
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, DollarSign, Users, Activity, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PromptManager from "./PromptManager";

interface AdminStats {
  totalUsers: number;
  totalCosts: number;
  todayCosts: number;
  totalAnalyses: number;
}

interface CostEntry {
  id: string;
  user_id: string;
  function_name: string;
  model_used: string;
  total_tokens: number;
  cost_usd: number;
  category: string;
  created_at: string;
  users?: { email: string; full_name: string } | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCosts: 0,
    todayCosts: 0,
    totalAnalyses: 0
  });
  const [recentCosts, setRecentCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total costs
      const { data: allCosts } = await supabase
        .from('api_costs')
        .select('cost_usd, created_at');

      const totalCosts = allCosts?.reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;
      
      // Calculate today's costs
      const today = new Date().toISOString().split('T')[0];
      const todayCosts = allCosts?.filter(cost => 
        cost.created_at.startsWith(today)
      ).reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;

      // Fetch recent cost entries with user info
      const { data: costs } = await supabase
        .from('api_costs')
        .select(`
          *,
          users:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: userCount || 0,
        totalCosts,
        todayCosts,
        totalAnalyses: allCosts?.length || 0
      });

      // Filter out any entries where the join failed and map to proper type
      const validCosts: CostEntry[] = (costs || []).map(cost => ({
        id: cost.id,
        user_id: cost.user_id,
        function_name: cost.function_name,
        model_used: cost.model_used,
        total_tokens: cost.total_tokens,
        cost_usd: cost.cost_usd,
        category: cost.category || 'unknown',
        created_at: cost.created_at,
        users: Array.isArray(cost.users) ? cost.users[0] : cost.users
      }));

      setRecentCosts(validCosts);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage prompts, monitor costs, and analyze usage</p>
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
      <Tabs defaultValue="prompts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Prompt Management
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <PromptManager />
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Usage</CardTitle>
              <CardDescription>
                Latest OpenAI API calls and their associated costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cost.users?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{cost.users?.email || 'Unknown'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cost.category}</Badge>
                      </TableCell>
                      <TableCell>{cost.model_used}</TableCell>
                      <TableCell>{cost.total_tokens}</TableCell>
                      <TableCell>{formatCurrency(Number(cost.cost_usd))}</TableCell>
                      <TableCell>{formatDate(cost.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
