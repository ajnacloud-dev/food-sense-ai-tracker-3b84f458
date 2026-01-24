
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UserUsageData } from "@/types/userAnalytics";
import { formatDate, getActivityStatus } from "@/utils/userAnalyticsUtils";

interface UserTableRowProps {
  user: UserUsageData;
  isExpanded: boolean;
  onToggleExpansion: (userId: string) => void;
}

const UserTableRow = ({ user, isExpanded, onToggleExpansion }: UserTableRowProps) => {
  const activityStatus = getActivityStatus(user.lastActive, user.todayAnalyses);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => onToggleExpansion(user.id)}>
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{user.full_name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={user.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {user.is_subscribed ? 'Pro' : 'Free'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.todayAnalyses}</span>
            {!user.is_subscribed && user.todayAnalyses >= 2 && (
              <Badge className="bg-red-100 text-red-800 text-xs">Limit Reached</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium">{user.totalAnalyses}</span>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>Today: {user.todayBilledUsage}</div>
            <div className="text-gray-500">Total: {user.totalBilledUsage}</div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <span className="text-sm">{formatDate(user.lastActive)}</span>
            {user.lastActivityType && (
              <div className="text-xs text-gray-400 capitalize">
                {user.lastActivityType}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={activityStatus.color}>
            {activityStatus.status}
          </Badge>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-gray-50">
            <div className="p-4">
              <h4 className="font-medium mb-2">7-Day Analysis Breakdown</h4>
              <div className="grid grid-cols-7 gap-2">
                {user.weeklyAnalyses.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-medium px-2 py-1 rounded ${
                      day.count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {day.count}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div>
                  <strong>Billing vs Analyses:</strong> {user.totalBilledUsage} billed / {user.totalAnalyses} analyses
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default UserTableRow;
