import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkoutEntry } from "@/types/workout";

interface WorkoutExercisesProps {
  workout: WorkoutEntry;
}

export const WorkoutExercises = ({ workout }: WorkoutExercisesProps) => {
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
      // If notes is not JSON or doesn't have exercises, fall back to regular notes display
    }
    return null;
  };

  const exercises = renderExercises(workout.notes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercises</CardTitle>
        <CardDescription>Detailed breakdown of your workout</CardDescription>
      </CardHeader>
      <CardContent>
        {exercises ? (
          exercises
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
