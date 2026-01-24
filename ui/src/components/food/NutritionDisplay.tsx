
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Flame, Apple, Droplets, Wheat, Heart, Clock, Calendar, TrendingUp } from "lucide-react";

interface NutritionDisplayProps {
  nutritionData: any;
}

export const NutritionDisplay = ({ nutritionData }: NutritionDisplayProps) => {
  if (!nutritionData) return null;

  const renderDetailedNutrition = () => {
    const nutrition = nutritionData.meal_summary?.total_nutrition;
    if (!nutrition) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Macronutrients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4">
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
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden flex gap-3 overflow-x-auto pb-2">
            <div className="flex-shrink-0 text-center p-3 bg-blue-50 rounded-lg min-w-[80px]">
              <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-600">{nutrition.proteins || 0}g</div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="flex-shrink-0 text-center p-3 bg-orange-50 rounded-lg min-w-[80px]">
              <Wheat className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-orange-600">{nutrition.carbohydrates || 0}g</div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="flex-shrink-0 text-center p-3 bg-purple-50 rounded-lg min-w-[80px]">
              <div className="text-lg font-bold text-purple-600">{nutrition.fats || 0}g</div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
            <div className="flex-shrink-0 text-center p-3 bg-yellow-50 rounded-lg min-w-[80px]">
              <div className="text-lg font-bold text-yellow-600">{nutrition.fiber || 0}g</div>
              <div className="text-xs text-gray-600">Fiber</div>
            </div>
            <div className="flex-shrink-0 text-center p-3 bg-red-50 rounded-lg min-w-[80px]">
              <div className="text-lg font-bold text-red-600">{nutrition.sodium || 0}mg</div>
              <div className="text-xs text-gray-600">Sodium</div>
            </div>
          </div>

          {/* Additional nutrients for desktop */}
          <div className="hidden md:grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{nutrition.fiber || 0}g</div>
              <div className="text-sm text-gray-600">Fiber</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{nutrition.sodium || 0}mg</div>
              <div className="text-sm text-gray-600">Sodium</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMealSummary = () => {
    const mealSummary = nutritionData.meal_summary;
    if (!mealSummary) return null;

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="meal-summary">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-green-500" />
              <span>Meal Summary</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mealSummary.meal_type && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-semibold text-purple-600">{mealSummary.meal_type}</div>
                      <div className="text-xs text-gray-600">Meal Type</div>
                    </div>
                  )}
                  {mealSummary.date && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs font-medium text-blue-600">{mealSummary.date}</div>
                    </div>
                  )}
                  {mealSummary.time && (
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <div className="text-xs font-medium text-yellow-600">{mealSummary.time}</div>
                    </div>
                  )}
                  {mealSummary.overall_meal_rating && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-semibold text-green-600">{mealSummary.overall_meal_rating}</div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                  )}
                </div>
                
                {mealSummary.dish_names && mealSummary.dish_names.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Dishes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mealSummary.dish_names.map((dish: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">{dish}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  const renderFoodItems = () => {
    const foodItems = nutritionData.food_items;
    if (!foodItems || !Array.isArray(foodItems)) return null;

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="food-items">
          <AccordionTrigger className="text-left">
            <span>Individual Food Items ({foodItems.length})</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {foodItems.map((item: any, index: number) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">{item.serving_size}</p>
                      </div>
                      <div className="flex gap-1">
                        {item.flags?.vegetarian && <Badge variant="outline" className="text-green-600 text-xs">Veg</Badge>}
                        {item.flags?.contains_allergens && <Badge variant="destructive" className="text-xs">Allergens</Badge>}
                      </div>
                    </div>
                    
                    {item.nutrition_values && (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-1 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.calories || 0}</div>
                          <div className="text-gray-500">cal</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.proteins || 0}g</div>
                          <div className="text-gray-500">protein</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.carbohydrates || 0}g</div>
                          <div className="text-gray-500">carbs</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.fats || 0}g</div>
                          <div className="text-gray-500">fat</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.fiber || 0}g</div>
                          <div className="text-gray-500">fiber</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{item.nutrition_values.sodium || 0}mg</div>
                          <div className="text-gray-500">sodium</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <div className="space-y-4">
      {renderDetailedNutrition()}
      {renderMealSummary()}
      {renderFoodItems()}
    </div>
  );
};
