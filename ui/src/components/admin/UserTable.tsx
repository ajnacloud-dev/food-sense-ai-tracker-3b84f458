
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserUsageData } from "@/types/userAnalytics";
import UserTableRow from "./UserTableRow";

interface UserTableProps {
  users: UserUsageData[];
  expandedUsers: Set<string>;
  onToggleExpansion: (userId: string) => void;
  loading: boolean;
  showActiveOnly: boolean;
}

const UserTable = ({ users, expandedUsers, onToggleExpansion, loading, showActiveOnly }: UserTableProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Today's Analyses</TableHead>
            <TableHead>Total Analyses</TableHead>
            <TableHead>Billed Usage</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              isExpanded={expandedUsers.has(user.id)}
              onToggleExpansion={onToggleExpansion}
            />
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {showActiveOnly ? 'No active users found' : 'No users found'}
        </div>
      )}
    </div>
  );
};

export default UserTable;
