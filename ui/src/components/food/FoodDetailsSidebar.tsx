
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Heart, AlertTriangle, Leaf, Shield } from "lucide-react";

interface FoodDetailsSidebarProps {
  totalNutrition: any;
  mealSummary: any;
  healthAssessment: any;
}

export const FoodDetailsSidebar = ({ totalNutrition, mealSummary, healthAssessment }: FoodDetailsSidebarProps) => {
  return (
    <div className="space-y-4">
      {/* Compact Nutrition & Rating Card */}
      {totalNutrition && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Nutrition Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Flame className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-700">{totalNutrition.calories || 0}</div>
                <div className="text-xs text-gray-600">Calories</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{totalNutrition.proteins || 0}g</div>
                <div className="text-xs text-gray-600">Protein</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-700">{totalNutrition.carbohydrates || 0}g</div>
                <div className="text-xs text-gray-600">Carbs</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">{totalNutrition.fats || 0}g</div>
                <div className="text-xs text-gray-600">Fat</div>
              </div>
            </div>
            
            {mealSummary?.overall_meal_rating && (
              <div className="text-center p-3 bg-green-50 rounded-lg border-t">
                <Heart className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">{mealSummary.overall_meal_rating}</div>
                <div className="text-xs text-gray-600">Overall Rating</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Alerts */}
      {healthAssessment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthAssessment.diabetes && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-orange-700">Diabetes</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                    {healthAssessment.diabetes.rating}
                  </Badge>
                </div>
                <p className="text-xs text-orange-600">{healthAssessment.diabetes.suggestion}</p>
              </div>
            )}
            
            {healthAssessment.hypertension && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-700">Hypertension</span>
                  <Badge variant="outline" className="bg-red-100 text-red-700 text-xs">
                    {healthAssessment.hypertension.rating}
                  </Badge>
                </div>
                <p className="text-xs text-red-600">{healthAssessment.hypertension.suggestion}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dietary Info */}
      {mealSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              Dietary Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {mealSummary.dietary_preferences?.map((pref: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 text-xs">
                  <Leaf className="h-3 w-3 mr-1" />
                  {pref}
                </Badge>
              ))}
            </div>
            
            {mealSummary.classification_confidence && (
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Classification</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {Math.round(mealSummary.classification_confidence * 100)}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
