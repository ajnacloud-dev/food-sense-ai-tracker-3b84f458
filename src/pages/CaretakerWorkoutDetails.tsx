import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Dumbbell, Calendar, User, Clock, Flame, MapPin } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { format } from 'date-fns';

interface Workout {
  id: string;
  workout_type: string;
  description: string;
  duration: number;
  calories_burned: number;
  intensity_level: string;
  location: string;
  notes: string;
  muscle_groups: string[];
  equipment_used: string[];
  image_url: string;
  created_at: string;
  user_id: string;
  workout_exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration_minutes: number;
  distance: number;
  calories_burned: number;
}

const CaretakerWorkoutDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedParticipantId && hasPermission('workouts') && id) {
      fetchWorkout();
    } else {
      setLoading(false);
    }
  }, [selectedParticipantId, hasPermission, id]);

  const fetchWorkout = async () => {
    if (!selectedParticipantId || !id) return;

    try {
      setLoading(true);
      console.log('CaretakerWorkoutDetails: Fetching workout:', id, 'for participant:', selectedParticipantId);
      
      const { data: workoutData, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq('id', id)
        .eq('user_id', selectedParticipantId)
        .single();

      if (error) {
        console.error('CaretakerWorkoutDetails: Error fetching workout:', error);
        if (error.message.includes('policy')) {
          toast.error('Access denied. Participant needs to grant permissions.');
        } else {
          throw error;
        }
        return;
      }

      console.log('CaretakerWorkoutDetails: Found workout:', workoutData);
      setWorkout(workoutData);
    } catch (error) {
      console.error('CaretakerWorkoutDetails: Error:', error);
      toast.error("Failed to load workout details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading workout details...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <SimpleRoleBasedLayout>
        <Card>
          <CardHeader>
            <CardTitle>No Participant Selected</CardTitle>
            <CardDescription>
              Please select a participant from the sidebar to view their workouts.
            </CardDescription>
          </CardHeader>
        </Card>
      </SimpleRoleBasedLayout>
    );
  }

  if (!hasPermission('workouts')) {
    return (
      <SimpleRoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-purple-600" />
              Workout Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/workouts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workouts
            </Button>
          </div>
          
          <PermissionStatusIndicator
            hasPermissions={false}
            participantName={participantData.full_name}
            missingCategories={['workouts']}
          />
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!workout) {
    return (
      <SimpleRoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-purple-600" />
              Workout Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/workouts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workouts
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Workout Not Found</CardTitle>
              <CardDescription>
                The requested workout could not be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  return (
    <SimpleRoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-purple-600" />
              Workout Details
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <User className="h-4 w-4" />
              <span>{participantData.full_name}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/caretaker/workouts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workouts
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Workout Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(workout.created_at), 'MMMM dd, yyyy - h:mm a')}
                </CardTitle>
                <Badge variant="outline">
                  {workout.workout_type?.replace('_', ' ') || 'Unknown'}
                </Badge>
              </div>
              <CardDescription>
                {workout.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            {workout.image_url && (
              <CardContent>
                <img 
                  src={workout.image_url} 
                  alt="Workout" 
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </CardContent>
            )}
          </Card>

          {/* Workout Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {workout.duration && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                      <Clock className="h-5 w-5" />
                      {workout.duration}
                    </div>
                    <div className="text-sm text-gray-500">Minutes</div>
                  </div>
                )}
                {workout.calories_burned && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                      <Flame className="h-5 w-5" />
                      {workout.calories_burned}
                    </div>
                    <div className="text-sm text-gray-500">Calories</div>
                  </div>
                )}
                {workout.intensity_level && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workout.intensity_level}</div>
                    <div className="text-sm text-gray-500">Intensity</div>
                  </div>
                )}
                {workout.location && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {workout.location}
                    </div>
                    <div className="text-sm text-gray-500">Location</div>
                  </div>
                )}
              </div>
              
              {(workout.muscle_groups?.length || workout.equipment_used?.length) && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {workout.muscle_groups?.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Muscle Groups</div>
                      <div className="flex flex-wrap gap-2">
                        {workout.muscle_groups.map((group, index) => (
                          <Badge key={index} variant="secondary">{group}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {workout.equipment_used?.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Equipment Used</div>
                      <div className="flex flex-wrap gap-2">
                        {workout.equipment_used.map((equipment, index) => (
                          <Badge key={index} variant="outline">{equipment}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exercises */}
          {workout.workout_exercises && workout.workout_exercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exercises</CardTitle>
                <CardDescription>
                  {workout.workout_exercises.length} exercise{workout.workout_exercises.length !== 1 ? 's' : ''} performed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workout.workout_exercises.map((exercise) => (
                    <div key={exercise.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{exercise.exercise_name}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {exercise.sets && (
                          <div>
                            <span className="text-gray-500">Sets:</span> {exercise.sets}
                          </div>
                        )}
                        {exercise.reps && (
                          <div>
                            <span className="text-gray-500">Reps:</span> {exercise.reps}
                          </div>
                        )}
                        {exercise.weight && (
                          <div>
                            <span className="text-gray-500">Weight:</span> {exercise.weight} lbs
                          </div>
                        )}
                        {exercise.duration_minutes && (
                          <div>
                            <span className="text-gray-500">Duration:</span> {exercise.duration_minutes} min
                          </div>
                        )}
                        {exercise.distance && (
                          <div>
                            <span className="text-gray-500">Distance:</span> {exercise.distance} miles
                          </div>
                        )}
                        {exercise.calories_burned && (
                          <div>
                            <span className="text-gray-500">Calories:</span> {exercise.calories_burned}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {workout.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{workout.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SimpleRoleBasedLayout>
  );
};

export default CaretakerWorkoutDetails;
