
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus, LayoutGrid, List } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { WorkoutStatsCards } from "@/components/workouts/WorkoutStatsCards";
import { WorkoutTable } from "@/components/workouts/WorkoutTable";
import { WorkoutCards } from "@/components/workouts/WorkoutCards";
import { WorkoutFilters } from "@/components/workouts/WorkoutFilters";
import { ModernFilterBar } from "@/components/common/ModernFilterBar";
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [workoutType, setWorkoutType] = useState('all');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [minCalories, setMinCalories] = useState('');
  const [maxCalories, setMaxCalories] = useState('');

  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    avgDuration: 0,
  });

  const sortOptions = [
    { value: 'date-desc', label: 'Date (newest first)' },
    { value: 'date-asc', label: 'Date (oldest first)' },
    { value: 'duration-desc', label: 'Duration (longest first)' },
    { value: 'duration-asc', label: 'Duration (shortest first)' },
    { value: 'calories-desc', label: 'Calories (highest first)' },
    { value: 'calories-asc', label: 'Calories (lowest first)' },
    { value: 'type-asc', label: 'Type (A-Z)' },
  ];

  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchWorkouts();
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch workouts
      const { data: workoutsData } = await api.from('workouts').select();
      // Fetch exercises
      const { data: exercisesData } = await api.from('workout_exercises').select();

      if (!workoutsData) throw new Error("Failed to fetch workouts");

      // Filter and Join
      const userWorkouts = workoutsData
        .filter((w: any) => w.user_id === user.id)
        .map((workout: any) => ({
          ...workout,
          workout_exercises: exercisesData ? exercisesData.filter((e: any) => e.workout_id === workout.id) : []
        }));

      // Sort
      userWorkouts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setWorkouts(userWorkouts);

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
      const { error } = await api.from('workouts').delete().eq('id', id);

      if (error) throw error;

      toast.success("Workout deleted successfully");
      fetchWorkouts();
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      toast.error("Failed to delete workout");
    }
  };

  // Filtered and sorted workouts
  const filteredWorkouts = useMemo(() => {
    let filtered = workouts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(workout =>
        workout.workout_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Workout type filter
    if (workoutType !== 'all') {
      filtered = filtered.filter(workout => workout.workout_type === workoutType);
    }

    // Duration range filter
    if (minDuration || maxDuration) {
      filtered = filtered.filter(workout => {
        const duration = workout.duration || 0;
        const min = minDuration ? parseInt(minDuration) : 0;
        const max = maxDuration ? parseInt(maxDuration) : Infinity;
        return duration >= min && duration <= max;
      });
    }

    // Calories range filter
    if (minCalories || maxCalories) {
      filtered = filtered.filter(workout => {
        const calories = workout.calories_burned || 0;
        const min = minCalories ? parseInt(minCalories) : 0;
        const max = maxCalories ? parseInt(maxCalories) : Infinity;
        return calories >= min && calories <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'duration-desc':
          return (b.duration || 0) - (a.duration || 0);
        case 'duration-asc':
          return (a.duration || 0) - (b.duration || 0);
        case 'calories-desc':
          return (b.calories_burned || 0) - (a.calories_burned || 0);
        case 'calories-asc':
          return (a.calories_burned || 0) - (b.calories_burned || 0);
        case 'type-asc':
          return (a.workout_type || '').localeCompare(b.workout_type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [workouts, searchTerm, sortBy, workoutType, minDuration, maxDuration, minCalories, maxCalories]);

  const workoutTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: workouts.length };
    workouts.forEach(workout => {
      const type = workout.workout_type || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [workouts]);

  const hasActiveFilters = workoutType !== 'all' || minDuration !== '' || maxDuration !== '' || minCalories !== '' || maxCalories !== '';

  const handleClearFilters = () => {
    setWorkoutType('all');
    setMinDuration('');
    setMaxDuration('');
    setMinCalories('');
    setMaxCalories('');
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

        {/* Modern Filter Bar */}
        <ModernFilterBar
          searchPlaceholder="Search workouts..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          advancedFilters={
            <WorkoutFilters
              workoutType={workoutType}
              onWorkoutTypeChange={setWorkoutType}
              minDuration={minDuration}
              onMinDurationChange={setMinDuration}
              maxDuration={maxDuration}
              onMaxDurationChange={setMaxDuration}
              minCalories={minCalories}
              onMinCaloriesChange={setMinCalories}
              maxCalories={maxCalories}
              onMaxCaloriesChange={setMaxCalories}
              workoutTypeCounts={workoutTypeCounts}
            />
          }
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          totalCount={workouts.length}
          filteredCount={filteredWorkouts.length}
        />

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
            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {workouts.length === 0 ? "No workouts yet" : "No workouts match your filters"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {workouts.length === 0
                    ? "Start tracking your fitness by adding your first workout with detailed exercise logging"
                    : "Try adjusting your filters to find what you're looking for"
                  }
                </p>
                {workouts.length === 0 && (
                  <Button
                    onClick={() => navigate("/capture")}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Workout
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <WorkoutCards
                    workouts={filteredWorkouts}
                    onDelete={deleteWorkout}
                    onView={(id) => navigate(`/workouts/${id}`)}
                  />
                ) : (
                  <div className="rounded-lg border border-green-200/50 overflow-hidden">
                    <WorkoutTable
                      workouts={filteredWorkouts}
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
