
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Heart, TrendingUp, Bell, Shield } from "lucide-react";
import ParticipantOverview from "./ParticipantOverview";
import CareRelationshipManager from "./CareRelationshipManager";
import InvitationCodeManager from "./InvitationCodeManager";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";

const CaretakerDashboard = () => {
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    loading, 
    error,
    refreshData 
  } = useCaretakerData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats from participants data
  const stats = {
    totalParticipants: participants.length,
    activeParticipants: participants.filter(p => p.status === 'active').length,
    pendingInvites: participants.filter(p => p.status === 'pending').length,
    todayActivities: Math.floor(Math.random() * 20) + 5 // This could be calculated from actual data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading caretaker dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (selectedParticipantId) {
    return (
      <ParticipantOverview 
        participantId={selectedParticipantId} 
        onBack={() => setSelectedParticipantId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caretaker Dashboard</h1>
          <p className="text-gray-600">Monitor and support your participants' health journey</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvites}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">My Participants</TabsTrigger>
          <TabsTrigger value="relationships">Manage Relationships</TabsTrigger>
          <TabsTrigger value="invitations">Invitation Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participant Overview</CardTitle>
              <CardDescription>
                Monitor your participants' health progress and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No participants found.</p>
                  <p className="text-sm text-gray-400">
                    Participants need to accept your invitation or you need to join as a caretaker using an invitation code.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Access Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => {
                      const PermissionStatusCell = () => {
                        const { hasPermission } = usePermissionStatus(participant.id);
                        const hasAnyPermission = hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts');
                        
                        return (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className={`h-4 w-4 ${hasAnyPermission ? 'text-green-600' : 'text-amber-600'}`} />
                              <Badge variant={hasAnyPermission ? 'default' : 'secondary'}>
                                {hasAnyPermission ? 'Granted' : 'Pending'}
                              </Badge>
                            </div>
                          </TableCell>
                        );
                      };

                      return (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{participant.full_name}</div>
                              <div className="text-sm text-gray-500">{participant.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {participant.caretaker_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{participant.permission_level.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(participant.status)}`}>
                              {participant.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${participant.health_score}%` }}
                                />
                              </div>
                              <span className="text-sm">{participant.health_score}%</span>
                            </div>
                          </TableCell>
                          <PermissionStatusCell />
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                console.log('CaretakerDashboard: View Details clicked for participant:', participant.id);
                                setSelectedParticipantId(participant.id);
                              }}
                              disabled={participant.status !== 'active'}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <CareRelationshipManager onRelationshipUpdated={refreshData} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationCodeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaretakerDashboard;
