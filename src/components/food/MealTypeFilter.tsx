
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Coffee, Sun, Moon, Cookie } from "lucide-react";

interface MealTypeFilterProps {
  selectedMealType: string;
  onMealTypeChange: (mealType: string) => void;
  mealTypeCounts: Record<string, number>;
}

export const MealTypeFilter = ({ selectedMealType, onMealTypeChange, mealTypeCounts }: MealTypeFilterProps) => {
  const mealTypes = [
    { value: 'all', label: 'All Meals', icon: Utensils },
    { value: 'breakfast', label: 'Breakfast', icon: Coffee },
    { value: 'lunch', label: 'Lunch', icon: Sun },
    { value: 'dinner', label: 'Dinner', icon: Moon },
    { value: 'snack', label: 'Snack', icon: Cookie },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {mealTypes.map((type) => {
        const Icon = type.icon;
        const count = type.value === 'all' ? Object.values(mealTypeCounts).reduce((sum, count) => sum + count, 0) : mealTypeCounts[type.value] || 0;
        
        return (
          <Button
            key={type.value}
            variant={selectedMealType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => onMealTypeChange(type.value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {type.label}
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};
