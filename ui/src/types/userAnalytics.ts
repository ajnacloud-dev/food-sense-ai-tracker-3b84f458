
export interface UserUsageData {
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

export interface UserMetrics {
  totalUsers: number;
  totalActiveUsers: number;
  usersAnalysesToday: number;
  totalSubscribedUsers: number;
  averageAnalysesPerUser: number;
}

export interface ActivityStatus {
  status: string;
  color: string;
}
