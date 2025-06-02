
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Flame, Eye, Trash2, MapPin, Zap } from "lucide-react";

interface WorkoutEntry {
  id: string;
  workout_type: string;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
  description?: string;
  intensity_level?: string;
  location?: string;
  equipment_used?: string[];
  muscle_groups?: string[];
}

interface WorkoutTableProps {
  workouts: WorkoutEntry[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

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

const getIntensityColor = (intensity: string) => {
  switch (intensity?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const WorkoutTable = ({ workouts, onDelete, onView }: WorkoutTableProps) => {
  const handleRowClick = (workoutId: string, event: React.MouseEvent) => {
    // Prevent row click when clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    onView(workoutId);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Calories</TableHead>
          <TableHead className="hidden sm:table-cell">Intensity</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
          <TableHead className="hidden lg:table-cell">Description</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workouts.map((workout) => (
          <TableRow 
            key={workout.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={(e) => handleRowClick(workout.id, e)}
          >
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
            <TableCell className="hidden sm:table-cell">
              {workout.intensity_level ? (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-gray-500" />
                  <Badge className={getIntensityColor(workout.intensity_level)} variant="outline">
                    {workout.intensity_level}
                  </Badge>
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {workout.location ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-600 truncate max-w-24">
                    {workout.location}
                  </span>
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="max-w-xs truncate text-sm text-gray-600">
                {workout.description || (
                  workout.notes ? (
                    typeof workout.notes === 'string' && workout.notes.startsWith('{') 
                      ? 'AI Analysis Available'
                      : workout.notes.substring(0, 50) + (workout.notes.length > 50 ? '...' : '')
                  ) : 'No description'
                )}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-sm text-gray-600">
              {formatDate(workout.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(workout.id)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(workout.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
