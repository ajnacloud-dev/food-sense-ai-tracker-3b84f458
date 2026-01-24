
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserCheck, CreditCard, BarChart3 } from "lucide-react";
import { UserMetrics } from "@/types/userAnalytics";

interface UserMetricsCardsProps {
  metrics: UserMetrics;
}

const UserMetricsCards = ({ metrics }: UserMetricsCardsProps) => {
  return (
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
  );
};

export default UserMetricsCards;
