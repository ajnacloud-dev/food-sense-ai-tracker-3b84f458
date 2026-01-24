
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Utensils, Zap, Leaf, Calendar } from "lucide-react";

interface CompactStatsGridProps {
  totalEntries: number;
  totalCalories: number;
  avgCalories: number;
  overallVegPercentage: number;
  isFiltered?: boolean;
  originalCount?: number;
}

export const CompactStatsGrid = ({
  totalEntries,
  totalCalories,
  avgCalories,
  overallVegPercentage,
  isFiltered = false,
  originalCount = 0
}: CompactStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Total Entries</p>
              <p className="text-xl font-bold">
                {totalEntries}
                {isFiltered && (
                  <span className="text-sm font-normal ml-1">/{originalCount}</span>
                )}
              </p>
            </div>
            <Utensils className="h-6 w-6 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Calories</p>
              <p className="text-xl font-bold">{Math.round(totalCalories).toLocaleString()}</p>
            </div>
            <Zap className="h-6 w-6 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Avg Calories</p>
              <p className="text-xl font-bold">{avgCalories}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium">Plant-Based</p>
              <p className="text-xl font-bold">{overallVegPercentage}%</p>
            </div>
            <Leaf className="h-6 w-6 text-emerald-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
