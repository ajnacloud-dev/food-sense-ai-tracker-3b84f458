
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { MealTypeFilter } from "./MealTypeFilter";
import { VegetarianFilter } from "./VegetarianFilter";
import { DateRangeFilter } from "./DateRangeFilter";
import { useIsMobile } from "@/hooks/use-mobile";

interface CompactFilterButtonProps {
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

export const CompactFilterButton = ({
  selectedMealType,
  onMealTypeChange,
  mealTypeCounts,
  selectedDietType,
  onDietTypeChange,
  dietTypeCounts,
  startDate,
  endDate,
  onDateRangeChange
}: CompactFilterButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Count active filters
  const activeFilters = [
    selectedMealType !== 'all' ? 1 : 0,
    selectedDietType !== 'all' ? 1 : 0,
    startDate || endDate ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  const clearAllFilters = () => {
    onMealTypeChange('all');
    onDietTypeChange('all');
    onDateRangeChange(undefined, undefined);
  };

  const getActiveFilterLabels = () => {
    const labels = [];
    if (selectedMealType !== 'all') {
      labels.push(`Meal: ${selectedMealType}`);
    }
    if (selectedDietType !== 'all') {
      labels.push(`Diet: ${selectedDietType}`);
    }
    if (startDate || endDate) {
      labels.push('Date range');
    }
    return labels;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
              size={isMobile ? "default" : "sm"}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className={`${isMobile ? 'w-screen mx-4' : 'w-96'} p-4`} 
            align={isMobile ? "center" : "start"}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Options</h4>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Meal Type Filter */}
              <div>
                <h5 className="text-sm font-medium mb-2 text-gray-700">Meal Type</h5>
                <MealTypeFilter
                  selectedMealType={selectedMealType}
                  onMealTypeChange={onMealTypeChange}
                  mealTypeCounts={mealTypeCounts}
                />
              </div>

              <Separator />

              {/* Diet Type Filter */}
              <div>
                <h5 className="text-sm font-medium mb-2 text-gray-700">Dietary Preference</h5>
                <VegetarianFilter
                  selectedDietType={selectedDietType}
                  onDietTypeChange={onDietTypeChange}
                  dietTypeCounts={dietTypeCounts}
                />
              </div>

              <Separator />

              {/* Date Range Filter */}
              <div>
                <h5 className="text-sm font-medium mb-2 text-gray-700">Date Range</h5>
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={onDateRangeChange}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-1">
          {getActiveFilterLabels().map((label, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {label}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => {
                  if (label.startsWith('Meal:')) onMealTypeChange('all');
                  if (label.startsWith('Diet:')) onDietTypeChange('all');
                  if (label.startsWith('Date')) onDateRangeChange(undefined, undefined);
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
