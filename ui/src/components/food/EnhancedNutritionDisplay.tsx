
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Droplets, Wheat, Apple, TrendingUp, Leaf } from "lucide-react";

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fats: number;
  total_fiber: number;
  total_sodium: number;
  meal_type: string;
  image_url: string;
  created_at: string;
  extracted_nutrients: any;
  user_id: string;
  food_items: any[];
}

interface EnhancedNutritionDisplayProps {
  entry: FoodEntry;
  showDetailedBreakdown?: boolean;
}

export const EnhancedNutritionDisplay = ({ entry, showDetailedBreakdown = false }: EnhancedNutritionDisplayProps) => {
  if (!entry) return null;

  // Use direct entry values or extracted nutrients
  const nutrition = {
    calories: entry.calories || entry.extracted_nutrients?.meal_summary?.total_nutrition?.calories || 0,
    proteins: entry.total_protein || entry.extracted_nutrients?.meal_summary?.total_nutrition?.proteins || 0,
    carbohydrates: entry.total_carbohydrates || entry.extracted_nutrients?.meal_summary?.total_nutrition?.carbohydrates || 0,
    fats: entry.total_fats || entry.extracted_nutrients?.meal_summary?.total_nutrition?.fats || 0,
    fiber: entry.total_fiber || entry.extracted_nutrients?.meal_summary?.total_nutrition?.fiber || 0,
    sodium: entry.total_sodium || entry.extracted_nutrients?.meal_summary?.total_nutrition?.sodium || 0,
  };

  // Daily value percentages (these are rough estimates for a 2000 calorie diet)
  const dailyValues = {
    calories: (nutrition.calories / 2000) * 100,
    proteins: (nutrition.proteins / 50) * 100,
    carbohydrates: (nutrition.carbohydrates / 250) * 100,
    fats: (nutrition.fats / 65) * 100,
    fiber: (nutrition.fiber / 25) * 100,
    sodium: (nutrition.sodium / 2300) * 100,
  };

  const MacroCard = ({ icon, label, value, unit, percentage, color }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {icon}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color }}>{Math.round(value || 0)}</span>
              <span className="text-sm text-gray-600">{unit}</span>
            </div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Daily Value</span>
            <span>{Math.round(percentage || 0)}%</span>
          </div>
          <Progress 
            value={Math.min(percentage || 0, 100)} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="border-green-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Macronutrients Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MacroCard
              icon={<Flame className="h-6 w-6 text-orange-500" />}
              label="Calories"
              value={nutrition.calories}
              unit="kcal"
              percentage={dailyValues.calories}
              color="#ea580c"
            />
            <MacroCard
              icon={<Droplets className="h-6 w-6 text-blue-500" />}
              label="Protein"
              value={nutrition.proteins}
              unit="g"
              percentage={dailyValues.proteins}
              color="#3b82f6"
            />
            <MacroCard
              icon={<Wheat className="h-6 w-6 text-yellow-500" />}
              label="Carbohydrates"
              value={nutrition.carbohydrates}
              unit="g"
              percentage={dailyValues.carbohydrates}
              color="#eab308"
            />
            <MacroCard
              icon={<Apple className="h-6 w-6 text-purple-500" />}
              label="Fat"
              value={nutrition.fats}
              unit="g"
              percentage={dailyValues.fats}
              color="#a855f7"
            />
            <MacroCard
              icon={<div className="w-6 h-6 bg-green-500 rounded" />}
              label="Fiber"
              value={nutrition.fiber}
              unit="g"
              percentage={dailyValues.fiber}
              color="#22c55e"
            />
            <MacroCard
              icon={<div className="w-6 h-6 bg-red-500 rounded" />}
              label="Sodium"
              value={nutrition.sodium}
              unit="mg"
              percentage={dailyValues.sodium}
              color="#ef4444"
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Food Items */}
      {showDetailedBreakdown && entry.food_items && Array.isArray(entry.food_items) && entry.food_items.length > 0 && (
        <Card className="border-green-200/50 shadow-lg">
          <CardHeader>
            <CardTitle>Individual Food Items ({entry.food_items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {entry.food_items.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.serving_size || item.quantity}</p>
                      <div className="flex gap-2 flex-wrap">
                        {item.flags?.vegetarian && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Leaf className="h-3 w-3 mr-1" />
                            Vegetarian
                          </Badge>
                        )}
                        {item.flags?.vegan && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Leaf className="h-3 w-3 mr-1" />
                            Vegan
                          </Badge>
                        )}
                        {item.flags?.contains_allergens && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Allergens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: 'Cal', value: Math.round((item.calories || 0) * (item.quantity || 1)), color: 'text-orange-600' },
                      { label: 'Protein', value: `${Math.round((item.proteins || 0) * (item.quantity || 1))}g`, color: 'text-blue-600' },
                      { label: 'Carbs', value: `${Math.round((item.carbohydrates || 0) * (item.quantity || 1))}g`, color: 'text-yellow-600' },
                      { label: 'Fat', value: `${Math.round((item.fats || 0) * (item.quantity || 1))}g`, color: 'text-purple-600' },
                      { label: 'Fiber', value: `${Math.round((item.fiber || 0) * (item.quantity || 1))}g`, color: 'text-green-600' },
                      { label: 'Sodium', value: `${Math.round((item.sodium || 0) * (item.quantity || 1))}mg`, color: 'text-red-600' },
                    ].map((nutrient, idx) => (
                      <div key={idx} className="text-center p-2 bg-white rounded border">
                        <div className={`font-bold ${nutrient.color}`}>{nutrient.value || 0}</div>
                        <div className="text-xs text-gray-500">{nutrient.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
