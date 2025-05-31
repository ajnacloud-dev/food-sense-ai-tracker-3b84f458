
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Heart, TrendingUp, Calendar, Plus, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PatientOverview from "./PatientOverview";
import CareRelationshipManager from "./CareRelationshipManager";

interface Patient {
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
  totalPatients: number;
  activePatients: number;
  pendingInvites: number;
  todayActivities: number;
}

const CaretakerDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<CaretakerStats>({
    totalPatients: 0,
    activePatients: 0,
    pendingInvites: 0,
    todayActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

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
          users:user_id (id, full_name, email)
        `)
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });

      const patientData: Patient[] = (relationships || []).map(rel => ({
        id: rel.user_id,
        full_name: rel.users?.full_name || 'Unknown',
        email: rel.users?.email || 'Unknown',
        caretaker_type: rel.caretaker_type,
        permission_level: rel.permission_level,
        status: rel.status,
        created_at: rel.created_at,
        health_score: Math.floor(Math.random() * 40) + 60 // Mock health score
      }));

      setPatients(patientData);

      // Calculate stats
      const activePatients = patientData.filter(p => p.status === 'active').length;
      const pendingInvites = patientData.filter(p => p.status === 'pending').length;

      setStats({
        totalPatients: patientData.length,
        activePatients,
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

  if (selectedPatient) {
    return (
      <PatientOverview 
        patientId={selectedPatient} 
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caretaker Dashboard</h1>
          <p className="text-gray-600">Monitor and support your patients' health journey</p>
        </div>
        <Button onClick={() => {/* Open invite modal */}}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Patient
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
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
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">My Patients</TabsTrigger>
          <TabsTrigger value="relationships">Manage Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patient Overview</CardTitle>
              <CardDescription>
                Monitor your patients' health progress and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-gray-500">{patient.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.caretaker_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.permission_level.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${patient.health_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{patient.health_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPatient(patient.id)}
                          disabled={patient.status !== 'active'}
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
