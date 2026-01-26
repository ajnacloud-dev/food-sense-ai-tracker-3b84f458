
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkoutEntry } from "@/types/workout";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api/client";

interface WorkoutExercisesProps {
  workout: WorkoutEntry;
}

export const WorkoutExercises = ({ workout }: WorkoutExercisesProps) => {
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['workout-exercises', workout.id],
    queryFn: async () => {
      const { data, error } = await backendApi
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workout.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const renderExercises = (notes: string) => {
    try {
      const parsedNotes = JSON.parse(notes);
      if (parsedNotes.exercises && Array.isArray(parsedNotes.exercises)) {
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Distance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedNotes.exercises.map((exercise: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{exercise.name}</TableCell>
                    <TableCell>{exercise.sets || '-'}</TableCell>
                    <TableCell>{exercise.reps || '-'}</TableCell>
                    <TableCell>{exercise.duration_seconds ? `${exercise.duration_seconds}s` : '-'}</TableCell>
                    <TableCell>{exercise.distance_km ? `${exercise.distance_km}km` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      }
    } catch (e) {
      // If notes is not JSON or doesn't have exercises, fall back to database exercises
    }
    return null;
  };

  const notesExercises = renderExercises(workout.notes);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>Loading exercise details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Loading exercises...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercises</CardTitle>
        <CardDescription>Detailed breakdown of your workout</CardDescription>
      </CardHeader>
      <CardContent>
        {exercises && exercises.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Calories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.exercise_name}</TableCell>
                    <TableCell>{exercise.sets || '-'}</TableCell>
                    <TableCell>{exercise.reps || '-'}</TableCell>
                    <TableCell>{exercise.weight ? `${exercise.weight}kg` : '-'}</TableCell>
                    <TableCell>{exercise.duration_minutes ? `${exercise.duration_minutes}m` : '-'}</TableCell>
                    <TableCell>{exercise.distance ? `${exercise.distance}km` : '-'}</TableCell>
                    <TableCell>{exercise.calories_burned || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : notesExercises ? (
          notesExercises
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No detailed exercise breakdown available.</p>
            <p className="text-sm mt-2">Future workouts may include exercise-by-exercise analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
