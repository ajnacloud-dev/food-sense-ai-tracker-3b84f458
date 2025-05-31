
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Flame, Eye, Trash2, Calendar } from "lucide-react";

interface WorkoutEntry {
  id: string;
  workout_type: string;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
}

interface WorkoutCardsProps {
  workouts: WorkoutEntry[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
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

export const WorkoutCards = ({ workouts, onDelete, onView }: WorkoutCardsProps) => {
  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <Card key={workout.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className={getWorkoutTypeColor(workout.workout_type)}>
                {workout.workout_type?.charAt(0).toUpperCase() + workout.workout_type?.slice(1) || 'Other'}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(workout.created_at)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{formatDuration(workout.duration || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{workout.calories_burned || 0} cal</span>
                </div>
              </div>
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
            </div>
            {workout.notes && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {typeof workout.notes === 'string' && workout.notes.startsWith('{') 
                  ? 'AI Analysis Available - View details for more information'
                  : workout.notes.substring(0, 100) + (workout.notes.length > 100 ? '...' : '')
                }
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
