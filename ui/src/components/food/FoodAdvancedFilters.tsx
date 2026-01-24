
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FoodAdvancedFiltersProps {
  selectedMealType: string;
  onMealTypeChange: (value: string) => void;
  mealTypeCounts: Record<string, number>;
  selectedDietType: string;
  onDietTypeChange: (value: string) => void;
  dietTypeCounts: Record<string, number>;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (start?: Date, end?: Date) => void;
}

export const FoodAdvancedFilters = ({
  selectedMealType,
  onMealTypeChange,
  mealTypeCounts,
  selectedDietType,
  onDietTypeChange,
  dietTypeCounts,
  startDate,
  endDate,
  onDateRangeChange,
}: FoodAdvancedFiltersProps) => {
  const mealTypes = [
    { value: 'all', label: 'All Meals' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snacks' },
  ];

  const dietTypes = [
    { value: 'all', label: 'All Diets' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Meal Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Meal Type</Label>
        <Select value={selectedMealType} onValueChange={onMealTypeChange}>
          <SelectTrigger className="border-green-200/60 focus:border-green-400">
            <SelectValue placeholder="Select meal type..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-green-200 shadow-lg">
            {mealTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="hover:bg-green-50">
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  {mealTypeCounts[type.value] !== undefined && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                      {mealTypeCounts[type.value]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Diet Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Diet Type</Label>
        <Select value={selectedDietType} onValueChange={onDietTypeChange}>
          <SelectTrigger className="border-green-200/60 focus:border-green-400">
            <SelectValue placeholder="Select diet type..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-green-200 shadow-lg">
            {dietTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="hover:bg-green-50">
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  {dietTypeCounts[type.value] !== undefined && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                      {dietTypeCounts[type.value]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal border-green-200/60 focus:border-green-400",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM dd") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => onDateRangeChange(date, endDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal border-green-200/60 focus:border-green-400",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM dd") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => onDateRangeChange(startDate, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
