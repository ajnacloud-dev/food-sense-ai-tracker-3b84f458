import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutEntry } from "@/types/workout";

interface WorkoutAnalysisProps {
  workout: WorkoutEntry;
}

export const WorkoutAnalysis = ({ workout }: WorkoutAnalysisProps) => {
  const renderWorkoutSummary = (notes: string) => {
    try {
      const parsedNotes = JSON.parse(notes);
      if (parsedNotes.workout_summary) {
        const summary = parsedNotes.workout_summary;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{summary.duration_minutes || 0}min</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{summary.estimated_calories_burned || 0}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{summary.intensity || 'N/A'}</div>
              <div className="text-sm text-gray-600">Intensity</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{summary.workout_type || 'General'}</div>
              <div className="text-sm text-gray-600">Type</div>
            </div>
          </div>
        );
      }
    } catch (e) {
      // If notes is not JSON, return null
    }
    return null;
  };

  const workoutSummary = renderWorkoutSummary(workout.notes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {workoutSummary ? (
          workoutSummary
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No AI analysis available for this workout.</p>
            <p className="text-sm mt-2">Future workouts will include detailed AI insights.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
