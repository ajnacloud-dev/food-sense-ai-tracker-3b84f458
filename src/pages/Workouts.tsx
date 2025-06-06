
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Clock, Flame, Plus, Trash2, Activity, Eye, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { WorkoutStatsCards } from "@/components/workouts/WorkoutStatsCards";
import { WorkoutTable } from "@/components/workouts/WorkoutTable";
import { WorkoutCards } from "@/components/workouts/WorkoutCards";
import { useIsMobile } from "@/hooks/use-mobile";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";

interface WorkoutEntry {
  id: string;
  workout_type: string;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
  user_id: string;
  description?: string;
  workout_exercises: {
    exercise_name: string;
    sets?: number;
    reps?: number;
    weight?: number;
  }[];
}

const Workouts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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
        .select(`
          *,
          workout_exercises (*)
        `)
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

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading workouts...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6 animate-fade-in">
        {/* Modern Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Workouts
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Track your fitness progress and activity with detailed analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-green-200 rounded-xl p-1 bg-white shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-9 px-4 ${viewMode === 'grid' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 text-gray-600'} transition-all duration-200`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-9 px-4 ${viewMode === 'table' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 text-gray-600'} transition-all duration-200`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={() => navigate("/capture")} 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Workout
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <WorkoutStatsCards stats={stats} />

        {/* Enhanced Workouts Display */}
        <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-green-50/50 to-white pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-green-700">
              <Dumbbell className="h-5 w-5" />
              Workout History
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Your complete fitness tracking with exercise analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {workouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No workouts yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start tracking your fitness by adding your first workout with detailed exercise logging
                </p>
                <Button 
                  onClick={() => navigate("/capture")}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Workout
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid gap-4">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="p-4 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-green-50/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Dumbbell className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{workout.workout_type}</h3>
                              <p className="text-sm text-gray-600">{new Date(workout.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/workouts/${workout.id}`)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteWorkout(workout.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-2 bg-white rounded-lg border border-green-100">
                            <div className="font-semibold text-green-600">{workout.duration || 0}</div>
                            <div className="text-gray-600">Minutes</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-green-100">
                            <div className="font-semibold text-orange-600">{workout.calories_burned || 0}</div>
                            <div className="text-gray-600">Calories</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-green-100">
                            <div className="font-semibold text-blue-600">{workout.workout_exercises?.length || 0}</div>
                            <div className="text-gray-600">Exercises</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-green-200/50 overflow-hidden">
                    <WorkoutTable 
                      workouts={workouts} 
                      onDelete={deleteWorkout} 
                      onView={(id) => navigate(`/workouts/${id}`)} 
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Workouts;
