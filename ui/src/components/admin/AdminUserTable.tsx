
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

const AdminUserTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await backendApi
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage users and their account status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name || 'No name'}</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    Role: {user.role} | Type: {user.user_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.is_subscribed ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm">Subscribed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500">
                    <UserX className="h-4 w-4" />
                    <span className="text-sm">Free</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserTable;
