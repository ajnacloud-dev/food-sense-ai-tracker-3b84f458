
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MealTypeFilter } from "./MealTypeFilter";
import { VegetarianFilter } from "./VegetarianFilter";
import { DateRangeFilter } from "./DateRangeFilter";

interface ComprehensiveFilterBarProps {
  // Meal type filter props
  selectedMealType: string;
  onMealTypeChange: (mealType: string) => void;
  mealTypeCounts: Record<string, number>;
  
  // Diet type filter props
  selectedDietType: string;
  onDietTypeChange: (dietType: string) => void;
  dietTypeCounts: Record<string, number>;
  
  // Date range filter props
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
}

export const ComprehensiveFilterBar = ({
  selectedMealType,
  onMealTypeChange,
  mealTypeCounts,
  selectedDietType,
  onDietTypeChange,
  dietTypeCounts,
  startDate,
  endDate,
  onDateRangeChange
}: ComprehensiveFilterBarProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Your Food Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal Type Filter */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-700">Meal Type</h4>
          <MealTypeFilter
            selectedMealType={selectedMealType}
            onMealTypeChange={onMealTypeChange}
            mealTypeCounts={mealTypeCounts}
          />
        </div>

        <Separator />

        {/* Diet Type Filter */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-700">Dietary Preference</h4>
          <VegetarianFilter
            selectedDietType={selectedDietType}
            onDietTypeChange={onDietTypeChange}
            dietTypeCounts={dietTypeCounts}
          />
        </div>

        <Separator />

        {/* Date Range Filter */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-700">Date Range</h4>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
