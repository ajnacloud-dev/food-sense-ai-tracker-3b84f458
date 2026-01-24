
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sprout, Utensils, Apple } from "lucide-react";

interface VegetarianFilterProps {
  selectedDietType: string;
  onDietTypeChange: (dietType: string) => void;
  dietTypeCounts: Record<string, number>;
}

export const VegetarianFilter = ({ selectedDietType, onDietTypeChange, dietTypeCounts }: VegetarianFilterProps) => {
  const dietTypes = [
    { value: 'all', label: 'All Foods', icon: Utensils, color: 'text-gray-600' },
    { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'text-green-600' },
    { value: 'vegan', label: 'Vegan', icon: Sprout, color: 'text-green-700' },
    { value: 'non-vegetarian', label: 'Non-Vegetarian', icon: Apple, color: 'text-red-600' },
    { value: 'mixed', label: 'Mixed', icon: Utensils, color: 'text-orange-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {dietTypes.map((type) => {
        const Icon = type.icon;
        const count = dietTypeCounts[type.value] || 0;
        
        // Only show options that have entries or the 'all' option
        if (count === 0 && type.value !== 'all') return null;
        
        return (
          <Button
            key={type.value}
            variant={selectedDietType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => onDietTypeChange(type.value)}
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${type.color}`} />
            <span className="text-xs sm:text-sm">{type.label}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};
