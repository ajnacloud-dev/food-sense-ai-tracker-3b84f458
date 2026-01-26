
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NutritionProgressProps {
  nutrition: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
    fiber?: number;
    sodium?: number;
  };
}

export const NutritionProgress = ({ nutrition }: NutritionProgressProps) => {
  const nutritionItems = [
    { name: "Protein", value: nutrition.proteins || 0, max: 50, unit: "g", color: "bg-blue-500" },
    { name: "Carbs", value: nutrition.carbohydrates || 0, max: 300, unit: "g", color: "bg-orange-500" },
    { name: "Fat", value: nutrition.fats || 0, max: 65, unit: "g", color: "bg-purple-500" },
    { name: "Fiber", value: nutrition.fiber || 0, max: 25, unit: "g", color: "bg-green-500" },
    { name: "Sodium", value: nutrition.sodium || 0, max: 2300, unit: "mg", color: "bg-red-500" },
  ];

  return (
    <div className="space-y-4">
      {nutritionItems.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-600">{item.value}{item.unit} / {item.max}{item.unit}</span>
          </div>
          <Progress 
            value={(item.value / item.max) * 100} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
};
