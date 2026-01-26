import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Flame } from "lucide-react";
import { WorkoutType, WorkoutEntry } from "@/types/workout";

interface WorkoutBasicInfoProps {
  workout: WorkoutEntry;
  editing: boolean;
  editedData: Partial<WorkoutEntry>;
  onEditedDataChange: (data: Partial<WorkoutEntry>) => void;
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const WorkoutBasicInfo = ({ workout, editing, editedData, onEditedDataChange }: WorkoutBasicInfoProps) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Workout Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium block mb-2">Workout Type</label>
          {editing ? (
            <Select 
              value={editedData.workout_type || 'other'} 
              onValueChange={(value: WorkoutType) => onEditedDataChange({ ...editedData, workout_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="flexibility">Flexibility</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-gray-900 font-medium">
              {workout.workout_type?.charAt(0).toUpperCase() + workout.workout_type?.slice(1) || 'Other'}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Duration</label>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editedData.duration || 0}
                onChange={(e) => onEditedDataChange({ ...editedData, duration: parseInt(e.target.value) || 0 })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-gray-900 font-medium">{formatDuration(workout.duration || 0)}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Calories Burned</label>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editedData.calories_burned || 0}
                onChange={(e) => onEditedDataChange({ ...editedData, calories_burned: parseInt(e.target.value) || 0 })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">calories</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-gray-900 font-medium">{workout.calories_burned || 0} calories</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{formatDuration(workout.duration || 0)}</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{workout.calories_burned || 0}</div>
              <div className="text-xs text-gray-600">Calories</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
