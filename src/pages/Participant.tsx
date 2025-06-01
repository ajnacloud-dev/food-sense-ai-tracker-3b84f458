
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserCheck, 
  Users, 
  Shield, 
  Mail, 
  Plus, 
  Settings,
  Eye,
  EyeOff,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { formatDistanceToNow } from "date-fns";

interface Caretaker {
  id: string;
  caretaker_id: string;
  caretaker_type: string;
  permission_level: string;
  status: string;
  created_at: string;
  notes?: string;
  caretaker_email?: string;
}

interface Permission {
  id: string;
  category: string;
  is_granted: boolean;
  caretaker_id: string;
  caretaker_email?: string;
}

const Participant = () => {
  const navigate = useNavigate();
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCaretakers: 0,
    pendingRequests: 0,
    activePermissions: 0
  });

  useEffect(() => {
    fetchCaretakersAndPermissions();
  }, []);

  const fetchCaretakersAndPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch caretaker relationships
      const { data: relationships, error: relError } = await supabase
        .from('care_relationships')
        .select('*')
        .eq('user_id', user.id);

      if (relError) throw relError;

      // Get caretaker emails separately
      const caretakerIds = (relationships || []).map(rel => rel.caretaker_id);
      let caretakerEmails: { [key: string]: string } = {};
      
      if (caretakerIds.length > 0) {
        const { data: caretakerUsers, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', caretakerIds);

        if (userError) throw userError;

        caretakerEmails = (caretakerUsers || []).reduce((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {} as { [key: string]: string });
      }

      // Transform the data to include caretaker email
      const caretakersData = (relationships || []).map(rel => ({
        ...rel,
        caretaker_email: caretakerEmails[rel.caretaker_id] || 'Unknown'
      }));

      setCaretakers(caretakersData);

      // Fetch permissions
      const { data: perms, error: permError } = await supabase
        .from('participant_permissions')
        .select('*')
        .eq('participant_id', user.id);

      if (permError) throw permError;

      // Get caretaker emails for permissions
      const permissionCaretakerIds = (perms || []).map(perm => perm.caretaker_id);
      let permissionCaretakerEmails: { [key: string]: string } = {};
      
      if (permissionCaretakerIds.length > 0) {
        const { data: permCaretakerUsers, error: permUserError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', permissionCaretakerIds);

        if (permUserError) throw permUserError;

        permissionCaretakerEmails = (permCaretakerUsers || []).reduce((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {} as { [key: string]: string });
      }

      const permissionsData = (perms || []).map(perm => ({
        ...perm,
        caretaker_email: permissionCaretakerEmails[perm.caretaker_id] || 'Unknown'
      }));

      setPermissions(permissionsData);

      // Calculate stats
      const totalCaretakers = caretakersData.length;
      const pendingRequests = caretakersData.filter(c => c.status === 'pending').length;
      const activePermissions = permissionsData.filter(p => p.is_granted).length;

      setStats({
        totalCaretakers,
        pendingRequests,
        activePermissions
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load caretaker information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'declined': return 'destructive';
      default: return 'outline';
    }
  };

  const getCaretakerPermissions = (caretakerId: string) => {
    return permissions.filter(p => p.caretaker_id === caretakerId);
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          Loading your caretaker information...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Participant Dashboard</h1>
            <p className="text-gray-600">Manage your caretakers and privacy settings</p>
          </div>
          <Button onClick={() => navigate('/participant/invitations')}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Caretaker
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Caretakers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCaretakers}</div>
              <p className="text-xs text-muted-foreground">People helping you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Mail className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePermissions}</div>
              <p className="text-xs text-muted-foreground">Data access granted</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => navigate('/participant/permissions')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Permissions</h3>
                  <p className="text-sm text-gray-600">Control what caretakers can see</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => navigate('/participant/invitations')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500 text-white">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">Invite Caretakers</h3>
                  <p className="text-sm text-gray-600">Send invitation codes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Caretakers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Your Caretakers
            </CardTitle>
            <CardDescription>
              People who have access to your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {caretakers.length > 0 ? (
              <div className="space-y-4">
                {caretakers.map((caretaker) => {
                  const caretakerPerms = getCaretakerPermissions(caretaker.caretaker_id);
                  const activePerms = caretakerPerms.filter(p => p.is_granted);
                  
                  return (
                    <div key={caretaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            <UserCheck className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{caretaker.caretaker_email}</h4>
                            <Badge variant={getStatusBadgeVariant(caretaker.status)}>
                              {caretaker.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 capitalize">
                            {caretaker.caretaker_type.replace('_', ' ')} • {activePerms.length} permissions granted
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(caretaker.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activePerms.length > 0 ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/participant/permissions')}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No caretakers yet</h3>
                <p className="mb-4">Invite family members or healthcare providers to help monitor your health</p>
                <Button onClick={() => navigate('/participant/invitations')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Caretaker
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Participant;
