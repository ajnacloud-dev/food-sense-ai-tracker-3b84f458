
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api/client";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Activity, Eye } from "lucide-react";
import { format } from "date-fns";
import CaretakerPageHeader from "./CaretakerPageHeader";
import CaretakerLoadingState from "./CaretakerLoadingState";
import CaretakerErrorState from "./CaretakerErrorState";

const CaretakerWorkoutContent = () => {
  const navigate = useNavigate();
  const { participantData } = useCaretakerData();

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['caretaker-workouts', participantData?.id],
    queryFn: async () => {
      if (!participantData?.id) throw new Error('No participant selected');
      
      const { data, error } = await backendApi
        .from('workouts')
        .select('*')
        .eq('user_id', participantData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!participantData?.id,
  });

  const handleViewWorkout = (workoutId: string) => {
    navigate(`/caretaker/workouts/${workoutId}`);
  };

  const handleBack = () => {
    navigate('/caretaker');
  };

  if (isLoading) {
    return <CaretakerLoadingState message="Loading participant workouts..." />;
  }

  if (error) {
    return (
      <CaretakerErrorState 
        error="Failed to load workout data. Please try again."
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CaretakerPageHeader
        title="Participant Workouts"
        subtitle="Track and monitor workout activities"
        icon={Activity}
        onBack={handleBack}
      />

      <div className="p-6 space-y-6">
        {!workouts || workouts.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>No Workouts Yet</CardTitle>
              <CardDescription>
                This participant hasn't logged any workouts yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{workout.workout_type}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(workout.created_at), 'MMM d, yyyy')}
                        </div>
                        {workout.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {workout.duration} min
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewWorkout(workout.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {workout.calories_burned && (
                        <Badge variant="secondary">
                          {workout.calories_burned} calories
                        </Badge>
                      )}
                      {workout.intensity_level && (
                        <Badge variant="outline">
                          {workout.intensity_level} intensity
                        </Badge>
                      )}
                    </div>
                  </div>
                  {workout.notes && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {workout.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaretakerWorkoutContent;
