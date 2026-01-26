
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Activity, Flame, Target, MapPin } from "lucide-react";
import { format } from "date-fns";
import { WorkoutExercises } from "@/components/workouts/WorkoutExercises";
import CaretakerPageHeader from "./CaretakerPageHeader";
import CaretakerLoadingState from "./CaretakerLoadingState";
import CaretakerErrorState from "./CaretakerErrorState";

const CaretakerWorkoutDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ['caretaker-workout-details', id],
    queryFn: async () => {
      if (!id) throw new Error('Workout ID is required');
      
      const { data, error } = await backendApi
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/caretaker/workouts');
  };

  if (isLoading) {
    return <CaretakerLoadingState message="Loading workout details..." />;
  }

  if (error || !workout) {
    return (
      <CaretakerErrorState 
        error="Failed to load workout details. Please try again."
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CaretakerPageHeader
        title="Workout Details"
        subtitle={workout.workout_type}
        icon={Activity}
        onBack={handleBack}
        backLabel="Back to Workouts"
      />

      <div className="p-6 space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              {workout.workout_type}
            </CardTitle>
            <CardDescription>
              Logged on {format(new Date(workout.created_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workout.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">{workout.duration}</span> minutes
                  </span>
                </div>
              )}
              {workout.calories_burned && (
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    <span className="font-medium">{workout.calories_burned}</span> calories
                  </span>
                </div>
              )}
              {workout.intensity_level && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    <span className="font-medium capitalize">{workout.intensity_level}</span> intensity
                  </span>
                </div>
              )}
              {workout.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{workout.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        {workout.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{workout.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Equipment and Muscle Groups */}
        {(workout.equipment_used || workout.muscle_groups) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workout.equipment_used && workout.equipment_used.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Equipment Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {workout.equipment_used.map((equipment, index) => (
                      <Badge key={index} variant="outline">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Muscle Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {workout.muscle_groups.map((muscle, index) => (
                      <Badge key={index} variant="secondary">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Exercises Card - Only show if there's workout data to pass */}
        <WorkoutExercises workout={workout} />
      </div>
    </div>
  );
};

export default CaretakerWorkoutDetails;
