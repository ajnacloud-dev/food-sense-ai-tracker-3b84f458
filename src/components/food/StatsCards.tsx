
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Flame, Calculator, Leaf } from "lucide-react";

interface StatsCardsProps {
  totalEntries: number;
  totalCalories: number;
  avgCalories: number;
  overallVegPercentage: number;
  isFiltered: boolean;
  originalCount: number;
}

export const StatsCards = ({
  totalEntries,
  totalCalories,
  avgCalories,
  overallVegPercentage,
  isFiltered,
  originalCount
}: StatsCardsProps) => {
  const statsData = [
    {
      icon: Utensils,
      value: totalEntries.toLocaleString(),
      label: "Entries",
      subLabel: isFiltered ? `of ${originalCount}` : "total",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: Flame,
      value: totalCalories.toLocaleString(),
      label: "Total Calories",
      subLabel: "consumed",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      icon: Calculator,
      value: avgCalories.toString(),
      label: "Avg Calories",
      subLabel: "per entry",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: Leaf,
      value: `${overallVegPercentage}%`,
      label: "Plant-Based",
      subLabel: "nutrition",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className={`${stat.borderColor} ${stat.bgColor} hover:shadow-sm transition-shadow duration-200`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
                {index === 0 && isFiltered && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Filtered
                  </Badge>
                )}
              </div>
              <div className="space-y-0.5">
                <div className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-700">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.subLabel}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
