
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Flame, Calendar } from "lucide-react";
import { calculateVegetarianPercentage, getVegetarianBadgeColor } from "@/utils/vegetarianUtils";

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

  const renderDietaryType = (entry: FoodEntry) => {
    const vegData = calculateVegetarianPercentage(entry);
    
    if (vegData.isVegan) {
      return <Badge className="bg-green-600 text-white text-xs">Vegan</Badge>;
    } else if (vegData.isVegetarian) {
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Vegetarian</Badge>;
    } else if (vegData.percentage > 0) {
      return <Badge className={`${getVegetarianBadgeColor(vegData.percentage)} text-xs`}>{vegData.percentage}% Veg</Badge>;
    } else {
      return <Badge variant="outline" className="text-red-600 text-xs">Non-Veg</Badge>;
    }
  };

  const mealType = getMealTypeFromEntry(entry);
  const dayType = getDayType(entry.created_at);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          {entry.image_url && (
            <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0">
              <img
                src={entry.image_url}
                alt="Food"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content Section */}
          <div className="flex-1 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                  {entry.description}
                </h3>
                
                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mealType && mealType !== 'unknown' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {mealType}
                    </Badge>
                  )}
                  {renderDietaryType(entry)}
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
                    <span className="font-medium">{entry.calories || 0}</span>
                    <span className="text-gray-500">cal</span>
                  </div>
                  {entry.total_protein > 0 && (
                    <div className="text-gray-600">
                      P: {entry.total_protein}g
                    </div>
                  )}
                  {entry.total_carbohydrates > 0 && (
                    <div className="text-gray-600">
                      C: {entry.total_carbohydrates}g
                    </div>
                  )}
                  {entry.total_fats > 0 && (
                    <div className="text-gray-600">
                      F: {entry.total_fats}g
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
                  onClick={() => onView(entry.id)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(entry.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
