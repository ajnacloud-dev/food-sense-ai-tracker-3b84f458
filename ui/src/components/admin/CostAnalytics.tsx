
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Activity, Calendar, Filter } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { formatDistanceToNow } from "date-fns";

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

interface CostSummary {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  avgCostPerCall: number;
}

const CostAnalytics = () => {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<CostEntry[]>([]);
  const [summary, setSummary] = useState<CostSummary>({
    totalCost: 0,
    totalTokens: 0,
    totalCalls: 0,
    avgCostPerCall: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState<string>("");

  // Unique values for filters
  const [uniqueUsers, setUniqueUsers] = useState<Array<{id: string, email: string, name: string}>>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);

  useEffect(() => {
    fetchCostData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [costs, selectedUser, selectedCategory, selectedModel, dateRange, searchEmail]);

  const fetchCostData = async () => {
    try {
      setLoading(true);

      // Fetch cost entries with user info
      const { data: costData } = await backendApi
        .from('api_costs')
        .select(`
          *,
          users:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (costData) {
        const validCosts: CostEntry[] = costData.map(cost => ({
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

        setCosts(validCosts);

        // Extract unique values for filters
        const users = validCosts
          .filter(cost => cost.users)
          .map(cost => ({
            id: cost.user_id,
            email: cost.users!.email,
            name: cost.users!.full_name || cost.users!.email
          }))
          .filter((user, index, self) => 
            self.findIndex(u => u.id === user.id) === index
          );

        const categories = [...new Set(validCosts.map(cost => cost.category))];
        const models = [...new Set(validCosts.map(cost => cost.model_used))];

        setUniqueUsers(users);
        setUniqueCategories(categories);
        setUniqueModels(models);
      }
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...costs];

    // User filter
    if (selectedUser !== "all") {
      filtered = filtered.filter(cost => cost.user_id === selectedUser);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(cost => cost.category === selectedCategory);
    }

    // Model filter
    if (selectedModel !== "all") {
      filtered = filtered.filter(cost => cost.model_used === selectedModel);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(cost => 
        new Date(cost.created_at) >= cutoffDate
      );
    }

    // Email search filter
    if (searchEmail) {
      filtered = filtered.filter(cost => 
        cost.users?.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        cost.users?.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredCosts(filtered);

    // Calculate summary
    const totalCost = filtered.reduce((sum, cost) => sum + Number(cost.cost_usd), 0);
    const totalTokens = filtered.reduce((sum, cost) => sum + cost.total_tokens, 0);
    const totalCalls = filtered.length;
    const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

    setSummary({
      totalCost,
      totalTokens,
      totalCalls,
      avgCostPerCall
    });
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

  const clearFilters = () => {
    setSelectedUser("all");
    setSelectedCategory("all");
    setSelectedModel("all");
    setDateRange("all");
    setSearchEmail("");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading cost analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (Filtered)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCalls.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Call</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgCostPerCall)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Search by Email/Name</label>
              <Input
                placeholder="Search users..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Details</CardTitle>
          <CardDescription>
            Detailed breakdown of API costs and usage ({filteredCosts.length} entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Function</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.slice(0, 100).map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{cost.users?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{cost.users?.email || 'Unknown'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {cost.function_name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cost.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{cost.model_used}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{cost.total_tokens.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(Number(cost.cost_usd))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(cost.created_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(cost.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCosts.length > 100 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Showing first 100 of {filteredCosts.length} entries
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostAnalytics;
