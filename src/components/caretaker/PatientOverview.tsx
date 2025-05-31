
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Utensils, Receipt, Dumbbell, MessageSquare, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PatientData {
  id: string;
  full_name: string;
  email: string;
  foodEntries: number;
  receipts: number;
  workouts: number;
  totalCalories: number;
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
    calories?: number;
  }>;
}

interface PatientOverviewProps {
  patientId: string;
  onBack: () => void;
}

const PatientOverview = ({ patientId, onBack }: PatientOverviewProps) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient basic info
      const { data: patient } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', patientId)
        .single();

      if (!patient) {
        toast.error('Patient not found');
        onBack();
        return;
      }

      // Fetch patient's food entries
      const { count: foodCount } = await supabase
        .from('food_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', patientId);

      // Fetch patient's receipts
      const { count: receiptsCount } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', patientId);

      // Fetch patient's workouts
      const { count: workoutsCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', patientId);

      // Fetch total calories
      const { data: foodEntries } = await supabase
        .from('food_entries')
        .select('calories, description, created_at')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

      // Fetch recent workouts
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('workout_type, calories_burned, created_at')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine recent activities
      const recentActivities = [
        ...(foodEntries || []).map(entry => ({
          type: 'food',
          description: entry.description || 'Food entry',
          date: entry.created_at,
          calories: entry.calories
        })),
        ...(recentWorkouts || []).map(workout => ({
          type: 'workout',
          description: `${workout.workout_type} workout`,
          date: workout.created_at,
          calories: workout.calories_burned
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setPatientData({
        id: patient.id,
        full_name: patient.full_name || 'Unknown',
        email: patient.email,
        foodEntries: foodCount || 0,
        receipts: receiptsCount || 0,
        workouts: workoutsCount || 0,
        totalCalories,
        recentActivities
      });

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils className="h-4 w-4 text-green-600" />;
      case 'workout': return <Dumbbell className="h-4 w-4 text-purple-600" />;
      case 'receipt': return <Receipt className="h-4 w-4 text-blue-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading patient data...</div>;
  }

  if (!patientData) {
    return <div className="flex items-center justify-center h-64">Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patientData.full_name}</h1>
            <p className="text-gray-600">{patientData.email}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          Active Patient
        </Badge>
      </div>

      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Entries</CardTitle>
            <Utensils className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData.foodEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData.receipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData.workouts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData.totalCalories.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
          <TabsTrigger value="notes">Caretaker Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest food entries, workouts, and other activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patientData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-gray-500">{formatDate(activity.date)}</div>
                    </div>
                    {activity.calories && (
                      <Badge variant="outline">
                        {activity.calories} cal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Progress</CardTitle>
              <CardDescription>
                Set and track goals for your patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No goals set yet. Create goals to help your patient stay on track.</p>
                <Button className="mt-4">
                  <Target className="h-4 w-4 mr-2" />
                  Set New Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Caretaker Notes</CardTitle>
              <CardDescription>
                Private notes and communication with your patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notes yet. Add notes to track progress and communicate with your patient.</p>
                <Button className="mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientOverview;
