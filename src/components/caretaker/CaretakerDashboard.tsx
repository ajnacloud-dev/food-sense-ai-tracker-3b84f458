
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Heart, TrendingUp, Calendar, Plus, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ParticipantOverview from "./ParticipantOverview";
import CareRelationshipManager from "./CareRelationshipManager";

interface Participant {
  id: string;
  full_name: string;
  email: string;
  caretaker_type: string;
  permission_level: string;
  status: string;
  created_at: string;
  last_activity?: string;
  health_score?: number;
}

interface CaretakerStats {
  totalParticipants: number;
  activeParticipants: number;
  pendingInvites: number;
  todayActivities: number;
}

const CaretakerDashboard = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<CaretakerStats>({
    totalParticipants: 0,
    activeParticipants: 0,
    pendingInvites: 0,
    todayActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  useEffect(() => {
    fetchCaretakerData();
  }, []);

  const fetchCaretakerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch care relationships where current user is the caretaker
      const { data: relationships } = await supabase
        .from('care_relationships')
        .select(`
          *,
          participant:users!care_relationships_user_id_fkey (id, full_name, email)
        `)
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });

      const participantData: Participant[] = (relationships || []).map(rel => ({
        id: rel.user_id,
        full_name: rel.participant?.full_name || 'Unknown',
        email: rel.participant?.email || 'Unknown',
        caretaker_type: rel.caretaker_type,
        permission_level: rel.permission_level,
        status: rel.status,
        created_at: rel.created_at,
        health_score: Math.floor(Math.random() * 40) + 60 // Mock health score
      }));

      setParticipants(participantData);

      // Calculate stats
      const activeParticipants = participantData.filter(p => p.status === 'active').length;
      const pendingInvites = participantData.filter(p => p.status === 'pending').length;

      setStats({
        totalParticipants: participantData.length,
        activeParticipants,
        pendingInvites,
        todayActivities: Math.floor(Math.random() * 20) + 5 // Mock data
      });

    } catch (error) {
      console.error('Error fetching caretaker data:', error);
      toast.error('Failed to load caretaker dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading caretaker dashboard...</div>;
  }

  if (selectedParticipant) {
    return (
      <ParticipantOverview 
        participantId={selectedParticipant} 
        onBack={() => setSelectedParticipant(null)}
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
        <Button onClick={() => {/* Open invite modal */}}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Participant
        </Button>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
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
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedParticipant(participant.id)}
                          disabled={participant.status !== 'active'}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <CareRelationshipManager onRelationshipUpdated={fetchCaretakerData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaretakerDashboard;
