import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X, Dumbbell } from "lucide-react";
import { WorkoutEntry } from "@/types/workout";

interface WorkoutHeaderProps {
  workout: WorkoutEntry;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
}

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

export const WorkoutHeader = ({ workout, editing, onEdit, onSave, onCancel, onBack }: WorkoutHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-background border-b pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="h-6 w-6 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900">Workout Details</h1>
              <Badge className={getWorkoutTypeColor(workout.workout_type)}>
                {workout.workout_type?.charAt(0).toUpperCase() + workout.workout_type?.slice(1) || 'Other'}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm">
              {new Date(workout.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {!editing ? (
            <Button onClick={onEdit} size="sm" className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={onSave} size="sm" className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={onCancel} size="sm" className="flex-1 sm:flex-none">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
