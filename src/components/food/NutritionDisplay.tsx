
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Apple, Droplets, Wheat, Heart, Clock, Calendar } from "lucide-react";

interface NutritionDisplayProps {
  nutritionData: any;
}

export const NutritionDisplay = ({ nutritionData }: NutritionDisplayProps) => {
  if (!nutritionData) return null;

  const renderMealSummary = () => {
    const mealSummary = nutritionData.meal_summary;
    if (!mealSummary) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-500" />
            Meal Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mealSummary.meal_type && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{mealSummary.meal_type}</div>
                <div className="text-sm text-gray-600">Meal Type</div>
              </div>
            )}
            {mealSummary.date && (
              <div className="text-center p-3 bg-blue-50 rounded-lg flex flex-col items-center">
                <Calendar className="h-4 w-4 text-blue-600 mb-1" />
                <div className="text-sm font-medium text-blue-600">{mealSummary.date}</div>
                <div className="text-xs text-gray-600">Date</div>
              </div>
            )}
            {mealSummary.time && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg flex flex-col items-center">
                <Clock className="h-4 w-4 text-yellow-600 mb-1" />
                <div className="text-sm font-medium text-yellow-600">{mealSummary.time}</div>
                <div className="text-xs text-gray-600">Time</div>
              </div>
            )}
            {mealSummary.overall_meal_rating && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{mealSummary.overall_meal_rating}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            )}
          </div>
          
          {mealSummary.dish_names && mealSummary.dish_names.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Dishes:</h4>
              <div className="flex flex-wrap gap-2">
                {mealSummary.dish_names.map((dish: string, index: number) => (
                  <Badge key={index} variant="secondary">{dish}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {mealSummary.meal_suggestion && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Meal Suggestion</h4>
              <p className="text-green-600">{mealSummary.meal_suggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDetailedNutrition = () => {
    const nutrition = nutritionData.meal_summary?.total_nutrition;
    if (!nutrition) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Detailed Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Flame className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{nutrition.calories || 0}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Droplets className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{nutrition.proteins || 0}g</div>
              <div className="text-sm text-gray-600">Protein</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Wheat className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{nutrition.carbohydrates || 0}g</div>
              <div className="text-sm text-gray-600">Carbs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{nutrition.fats || 0}g</div>
              <div className="text-sm text-gray-600">Fat</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{nutrition.fiber || 0}g</div>
              <div className="text-sm text-gray-600">Fiber</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{nutrition.sodium || 0}mg</div>
              <div className="text-sm text-gray-600">Sodium</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNutritionFocus = () => {
    const focus = nutritionData.nutrition_focus;
    if (!focus) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Nutrition Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {focus.nutrients_high && focus.nutrients_high.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-2">High Nutrients:</h4>
              <div className="flex flex-wrap gap-2">
                {focus.nutrients_high.map((nutrient: string, index: number) => (
                  <Badge key={index} variant="destructive">{nutrient}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {focus.nutrients_low && focus.nutrients_low.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-600 mb-2">Low Nutrients:</h4>
              <div className="flex flex-wrap gap-2">
                {focus.nutrients_low.map((nutrient: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-yellow-500 text-yellow-600">{nutrient}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {focus.suggestion && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">Nutrition Suggestion</h4>
              <p className="text-blue-600">{focus.suggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHealthAssessment = () => {
    const health = nutritionData.health_assessment;
    if (!health) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Health Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {health.diabetes && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-700 mb-2">
                Diabetes Rating: {health.diabetes.rating}
              </h4>
              <p className="text-orange-600">{health.diabetes.suggestion}</p>
            </div>
          )}
          
          {health.hypertension && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-700 mb-2">
                Hypertension Rating: {health.hypertension.rating}
              </h4>
              <p className="text-red-600">{health.hypertension.suggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFoodItems = () => {
    const foodItems = nutritionData.food_items;
    if (!foodItems || !Array.isArray(foodItems)) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Individual Food Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {foodItems.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.serving_size}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.flags?.vegetarian && <Badge variant="outline" className="text-green-600">Vegetarian</Badge>}
                    {item.flags?.contains_allergens && <Badge variant="destructive">Allergens</Badge>}
                    {item.flags?.conflicts_with_diet_goal && <Badge variant="destructive">Diet Conflict</Badge>}
                  </div>
                </div>
                
                {item.nutrition_values && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.calories || 0}</div>
                      <div className="text-gray-500">cal</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.proteins || 0}g</div>
                      <div className="text-gray-500">protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.carbohydrates || 0}g</div>
                      <div className="text-gray-500">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.fats || 0}g</div>
                      <div className="text-gray-500">fat</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.fiber || 0}g</div>
                      <div className="text-gray-500">fiber</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{item.nutrition_values.sodium || 0}mg</div>
                      <div className="text-gray-500">sodium</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderMealSummary()}
      {renderDetailedNutrition()}
      {renderNutritionFocus()}
      {renderHealthAssessment()}
      {renderFoodItems()}
    </div>
  );
};
