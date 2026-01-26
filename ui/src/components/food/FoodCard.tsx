
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Trash2, Flame, Calendar, Utensils } from "lucide-react";
import { calculateDetailedDietaryBreakdown, getDietaryDisplayBadges } from "@/utils/vegetarianUtils";

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
}

interface FoodCardProps {
  entry: FoodEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  getMealTypeFromEntry: (entry: FoodEntry) => string;
}

export const FoodCard = ({ entry, onView, onDelete, getMealTypeFromEntry }: FoodCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayType = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
  };

  const getCaloriesFromEntry = (entry: FoodEntry) => {
    // Try extracted_nutrients first
    const extractedCalories = entry.extracted_nutrients?.meal_summary?.total_nutrition?.calories || 
                             entry.extracted_nutrients?.calories;
    if (extractedCalories) return extractedCalories;
    
    // Fallback to direct field
    return entry.calories || 0;
  };

  const getNutritionFromEntry = (entry: FoodEntry) => {
    // Try extracted_nutrients first
    const extractedNutrition = entry.extracted_nutrients?.meal_summary?.total_nutrition;
    if (extractedNutrition) {
      return {
        protein: extractedNutrition.proteins || 0,
        carbohydrates: extractedNutrition.carbohydrates || 0,
        fats: extractedNutrition.fats || 0,
      };
    }
    
    // Fallback to direct fields
    return {
      protein: entry.total_protein || 0,
      carbohydrates: entry.total_carbohydrates || 0,
      fats: entry.total_fats || 0,
    };
  };

  const renderDietaryBreakdown = (entry: FoodEntry) => {
    const breakdown = calculateDetailedDietaryBreakdown(entry);
    const badges = getDietaryDisplayBadges(breakdown);
    
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((badge, index) => (
          <Badge key={index} className={`${badge.color} text-xs`}>
            {badge.text}
          </Badge>
        ))}
      </div>
    );
  };

  const handleCardClick = (event: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or other interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    onView(entry.id);
  };

  const mealType = getMealTypeFromEntry(entry);
  const dayType = getDayType(entry.created_at);
  const calories = getCaloriesFromEntry(entry);
  const nutrition = getNutritionFromEntry(entry);

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 overflow-hidden border hover:border-gray-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0">
            <Avatar className="w-full h-full rounded-none">
              {entry.image_url && (
                <AvatarImage src={entry.image_url} alt="Food" className="object-cover" />
              )}
              <AvatarFallback className="rounded-none bg-orange-100">
                <Utensils className="h-8 w-8 text-orange-600" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-sm sm:text-base">
                  {entry.description}
                </h3>
                
                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mealType && mealType !== 'unknown' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {mealType}
                    </Badge>
                  )}
                  {renderDietaryBreakdown(entry)}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${dayType === 'weekend' 
                      ? "bg-purple-50 text-purple-700 border-purple-200" 
                      : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {dayType === 'weekend' ? 'Weekend' : 'Weekday'}
                  </Badge>
                </div>

                {/* Nutrition Info */}
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="font-medium">{Math.round(calories)}</span>
                    <span className="text-gray-500">cal</span>
                  </div>
                  {nutrition.protein > 0 && (
                    <div className="text-gray-600">
                      P: {Math.round(nutrition.protein)}g
                    </div>
                  )}
                  {nutrition.carbohydrates > 0 && (
                    <div className="text-gray-600">
                      C: {Math.round(nutrition.carbohydrates)}g
                    </div>
                  )}
                  {nutrition.fats > 0 && (
                    <div className="text-gray-600">
                      F: {Math.round(nutrition.fats)}g
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(entry.created_at)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(entry.id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
