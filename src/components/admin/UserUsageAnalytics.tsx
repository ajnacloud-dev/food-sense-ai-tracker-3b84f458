
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Calendar, Filter } from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { StandardFilters } from "@/components/common/StandardFilters";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";
import { useUserFilters } from "@/hooks/useUserFilters";
import UserMetricsCards from "./UserMetricsCards";
import UserTable from "./UserTable";
import { sortOptions } from "@/utils/userAnalyticsUtils";

const UserUsageAnalytics = () => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { allUsers, metrics, loading, fetchUserUsage } = useUserAnalytics();
  
  const {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    showActiveOnly,
    setShowActiveOnly,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters
  } = useUserFilters(allUsers);

  const { isRefreshing, lastRefresh } = useAutoRefresh({
    enabled: true,
    interval: 30000, // 30 seconds
    onRefresh: fetchUserUsage
  });

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

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
      <UserMetricsCards metrics={metrics} />

      {/* Filters */}
      <StandardFilters
        searchPlaceholder="Search users by email or name..."
        sortOptions={sortOptions}
        customFilters={customFilters}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        totalCount={allUsers.length}
        filteredCount={filteredUsers.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
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
          <UserTable
            users={filteredUsers}
            expandedUsers={expandedUsers}
            onToggleExpansion={toggleUserExpansion}
            loading={loading}
            showActiveOnly={showActiveOnly}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserUsageAnalytics;
