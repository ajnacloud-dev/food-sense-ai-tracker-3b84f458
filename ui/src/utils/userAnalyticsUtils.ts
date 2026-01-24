
import { ActivityStatus } from "@/types/userAnalytics";

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getActivityStatus = (lastActive: string | null, todayAnalyses: number): ActivityStatus => {
  if (!lastActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0 && todayAnalyses > 0) return { status: 'active today', color: 'bg-green-100 text-green-800' };
  if (daysSince === 0) return { status: 'seen today', color: 'bg-blue-100 text-blue-800' };
  if (daysSince <= 3) return { status: 'recent', color: 'bg-yellow-100 text-yellow-800' };
  if (daysSince <= 7) return { status: 'this week', color: 'bg-orange-100 text-orange-800' };
  return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
};

export const sortOptions = [
  { value: "totalAnalyses-desc", label: "Total Analyses (High to Low)" },
  { value: "totalAnalyses-asc", label: "Total Analyses (Low to High)" },
  { value: "todayAnalyses-desc", label: "Today's Analyses (High to Low)" },
  { value: "email-asc", label: "Email (A-Z)" },
  { value: "email-desc", label: "Email (Z-A)" },
  { value: "created-desc", label: "Newest Users" },
  { value: "created-asc", label: "Oldest Users" },
];
