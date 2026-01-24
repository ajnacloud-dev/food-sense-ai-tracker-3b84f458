
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkoutFiltersProps {
  workoutType: string;
  onWorkoutTypeChange: (value: string) => void;
  minDuration: string;
  onMinDurationChange: (value: string) => void;
  maxDuration: string;
  onMaxDurationChange: (value: string) => void;
  minCalories: string;
  onMinCaloriesChange: (value: string) => void;
  maxCalories: string;
  onMaxCaloriesChange: (value: string) => void;
  workoutTypeCounts: Record<string, number>;
}

export const WorkoutFilters = ({
  workoutType,
  onWorkoutTypeChange,
  minDuration,
  onMinDurationChange,
  maxDuration,
  onMaxDurationChange,
  minCalories,
  onMinCaloriesChange,
  maxCalories,
  onMaxCaloriesChange,
  workoutTypeCounts,
}: WorkoutFiltersProps) => {
  const workoutTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'strength', label: 'Strength' },
    { value: 'flexibility', label: 'Flexibility' },
    { value: 'sports', label: 'Sports' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Workout Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Workout Type</Label>
        <Select value={workoutType} onValueChange={onWorkoutTypeChange}>
          <SelectTrigger className="border-green-200/60 focus:border-green-400">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-green-200 shadow-lg">
            {workoutTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="hover:bg-green-50">
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  {workoutTypeCounts[type.value] !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({workoutTypeCounts[type.value]})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Duration (minutes)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minDuration}
            onChange={(e) => onMinDurationChange(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxDuration}
            onChange={(e) => onMaxDurationChange(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
        </div>
      </div>

      {/* Calories Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Calories Burned</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minCalories}
            onChange={(e) => onMinCaloriesChange(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxCalories}
            onChange={(e) => onMaxCaloriesChange(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
        </div>
      </div>
    </div>
  );
};
