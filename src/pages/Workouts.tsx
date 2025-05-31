
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Clock, Flame, Plus, Trash2, Activity, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { WorkoutStatsCards } from "@/components/workouts/WorkoutStatsCards";
import { WorkoutTable } from "@/components/workouts/WorkoutTable";
import { WorkoutCards } from "@/components/workouts/WorkoutCards";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workouts...</div>
        </div>
      </SidebarLayout>
    );
  }

  const recentWorkouts = workouts.slice(0, 5);
  const allWorkouts = workouts;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
            <p className="text-gray-600">Track your fitness progress and activity</p>
          </div>
          <Button onClick={() => navigate("/capture")} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Workout
          </Button>
        </div>

        {/* Stats Cards */}
        <WorkoutStatsCards stats={stats} />

        {/* Workouts Content */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Workouts</TabsTrigger>
            <TabsTrigger value="all">All Workouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest 5 workouts</CardDescription>
              </CardHeader>
              <CardContent>
                {recentWorkouts.length === 0 ? (
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
                  <>
                    {isMobile ? (
                      <WorkoutCards workouts={recentWorkouts} onDelete={deleteWorkout} onView={(id) => navigate(`/workouts/${id}`)} />
                    ) : (
                      <WorkoutTable workouts={recentWorkouts} onDelete={deleteWorkout} onView={(id) => navigate(`/workouts/${id}`)} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Workouts</CardTitle>
                <CardDescription>Complete workout history</CardDescription>
              </CardHeader>
              <CardContent>
                {allWorkouts.length === 0 ? (
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
                  <>
                    {isMobile ? (
                      <WorkoutCards workouts={allWorkouts} onDelete={deleteWorkout} onView={(id) => navigate(`/workouts/${id}`)} />
                    ) : (
                      <WorkoutTable workouts={allWorkouts} onDelete={deleteWorkout} onView={(id) => navigate(`/workouts/${id}`)} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default Workouts;
