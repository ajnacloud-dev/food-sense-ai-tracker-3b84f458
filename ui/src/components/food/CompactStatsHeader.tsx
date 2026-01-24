
import { Badge } from "@/components/ui/badge";
import { Utensils, Flame, Leaf } from "lucide-react";

interface CompactStatsHeaderProps {
  totalEntries: number;
  totalCalories: number;
  avgCalories: number;
  overallVegPercentage: number;
  isFiltered: boolean;
  originalCount: number;
}

export const CompactStatsHeader = ({
  totalEntries,
  totalCalories,
  avgCalories,
  overallVegPercentage,
  isFiltered,
  originalCount
}: CompactStatsHeaderProps) => {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
      <div className="flex items-center gap-2">
        <Utensils className="h-4 w-4 text-green-600" />
        <span className="font-medium">{totalEntries.toLocaleString()}</span>
        <span>entries</span>
        {isFiltered && (
          <Badge variant="secondary" className="text-xs">
            of {originalCount}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-600" />
        <span className="font-medium">{totalCalories.toLocaleString()}</span>
        <span>total cal</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-blue-600" />
        <span className="font-medium">{avgCalories}</span>
        <span>avg cal</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-green-600" />
        <span className="font-medium">{overallVegPercentage}%</span>
        <span>plant-based</span>
      </div>
    </div>
  );
};
