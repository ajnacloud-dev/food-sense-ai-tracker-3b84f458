
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Settings, Shield, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";

interface CaretakerRelationship {
  id: string;
  caretaker_id: string;
  caretaker_type: string;
  status: string;
  caretaker: {
    full_name: string | null;
    email: string;
  };
}

const Participant = () => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<CaretakerRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaretakerRelationships();
  }, []);

  const fetchCaretakerRelationships = async () => {
    try {
      // With Mock Auth/Amplify, `user` in context might be null initially? 
      // Assuming we can get user ID from localstorage or context if this component mounts.
      // But let's use the API calls directly.
      const user = { id: 'test-user-id' }; // TODO: Retrieve real user from useAuth()

      // Fetch relationships
      const { data: relationshipsData } = await api.from('care_relationships').select();

      const processedRelationships: CaretakerRelationship[] = [];

      if (relationshipsData && relationshipsData.length > 0) {
        // Fetch all users for manual join
        const { data: allUsers } = await api.from('users').select();

        // Filter by user_id and join
        const userRelationships = relationshipsData.filter((r: any) => r.user_id === user.id);

        for (const rel of userRelationships) {
          const caretakerData = allUsers ? allUsers.find((u: any) => u.id === rel.caretaker_id) : null;

          if (caretakerData) {
            processedRelationships.push({
              id: rel.id,
              caretaker_id: rel.caretaker_id,
              caretaker_type: rel.caretaker_type,
              status: rel.status,
              caretaker: {
                full_name: caretakerData.full_name,
                email: caretakerData.email
              }
            });
          }
        }
      }

      setRelationships(processedRelationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load caretaker relationships');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Participant Dashboard</h1>
            <p className="text-gray-600">Manage your health data and caretaker permissions</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Caretakers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {relationships.filter(r => r.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {relationships.filter(r => r.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Relationships</CardTitle>
              <Settings className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relationships.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invite New Caretakers
              </CardTitle>
              <CardDescription>
                Create invitation codes for healthcare providers, family members, or other caretakers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/participant/invitations')}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Invitation Code
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage Permissions
              </CardTitle>
              <CardDescription>
                Control what data your caretakers can access and modify their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate('/participant/permissions')}
                className="w-full flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Permission Settings
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Caretakers */}
        <Card>
          <CardHeader>
            <CardTitle>Your Caretakers</CardTitle>
            <CardDescription>
              People who have access to monitor your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {relationships.length > 0 ? (
              <div className="space-y-4">
                {relationships.map((relationship) => (
                  <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">
                          {relationship.caretaker.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {relationship.caretaker.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {relationship.caretaker_type.replace('_', ' ')}
                          </Badge>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(relationship.status)}`}>
                            {relationship.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/participant/permissions')}
                    >
                      Manage Access
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No caretakers yet</h3>
                <p className="mb-4">Invite healthcare providers, family members, or other caretakers to monitor your health data.</p>
                <Button onClick={() => navigate('/participant/invitations')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invitation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default Participant;
