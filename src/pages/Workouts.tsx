
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell, Clock, Flame, Plus, Trash2, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

interface WorkoutEntry {
  id: string;
  workout_type: string;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
}

const Workouts = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkouts(data || []);
      
      // Calculate stats
      const totalWorkouts = data?.length || 0;
      const totalDuration = data?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0;
      const totalCalories = data?.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0) || 0;
      const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
      
      setStats({ totalWorkouts, totalDuration, totalCalories, avgDuration });
    } catch (error: any) {
      console.error('Error fetching workouts:', error);
      toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Workout deleted successfully");
      fetchWorkouts();
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      toast.error("Failed to delete workout");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'cardio':
        return 'bg-red-100 text-red-800';
      case 'strength':
        return 'bg-blue-100 text-blue-800';
      case 'flexibility':
        return 'bg-green-100 text-green-800';
      case 'sports':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workouts...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
            <p className="text-gray-600">Track your fitness progress and activity</p>
          </div>
          <Button onClick={() => navigate("/capture")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Workout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">Sessions completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">Time exercised</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total burned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
              <p className="text-xs text-muted-foreground">Per workout</p>
            </CardContent>
          </Card>
        </div>

        {/* Workouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workout History</CardTitle>
            <CardDescription>Your fitness activities and performance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
                <p className="text-gray-600 mb-4">Start tracking your fitness by adding your first workout</p>
                <Button onClick={() => navigate("/capture")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Workout
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workouts.map((workout) => (
                    <TableRow key={workout.id}>
                      <TableCell>
                        <Badge className={getWorkoutTypeColor(workout.workout_type)}>
                          {workout.workout_type?.charAt(0).toUpperCase() + workout.workout_type?.slice(1) || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          {formatDuration(workout.duration || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {workout.calories_burned || 0} cal
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {workout.notes || 'No notes'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(workout.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/workouts/${workout.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteWorkout(workout.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Workouts;
