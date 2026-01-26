
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Utensils, Clock, Eye, Trash2, Zap, Leaf } from "lucide-react";
import { format } from 'date-fns';
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";

interface FoodEntry {
  id: string;
  created_at: string;
  description?: string;
  user_id: string;
  meal_type?: string;
  total_protein?: number;
  total_carbohydrates?: number;
  total_fats?: number;
  calories?: number;
  image_url?: string;
  extracted_nutrients?: any;
  food_items: any[];
}

interface ModernFoodGridProps {
  entries: FoodEntry[];
  onView: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  getMealTypeFromEntry?: (entry: FoodEntry) => string;
}

export const ModernFoodGrid = ({ 
  entries, 
  onView, 
  onDelete, 
  getMealTypeFromEntry 
}: ModernFoodGridProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const calculateTotals = (entry: FoodEntry) => {
    const extractedNutrition = entry.extracted_nutrients?.meal_summary?.total_nutrition;
    
    if (extractedNutrition) {
      return {
        totalCalories: extractedNutrition.calories || 0,
        totalProtein: extractedNutrition.proteins || 0,
        totalCarbs: extractedNutrition.carbohydrates || 0,
        totalFat: extractedNutrition.fats || 0,
      };
    }

    let totalCalories = entry.calories || 0;
    let totalProtein = entry.total_protein || 0;
    let totalCarbs = entry.total_carbohydrates || 0;
    let totalFat = entry.total_fats || 0;

    if (!totalCalories && entry.food_items?.length > 0) {
      entry.food_items.forEach(item => {
        const quantity = item.quantity || 1;
        totalCalories += (item.calories || 0) * quantity;
        totalProtein += (item.proteins || 0) * quantity;
        totalCarbs += (item.carbohydrates || 0) * quantity;
        totalFat += (item.fats || 0) * quantity;
      });
    }

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lunch': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dinner': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'snack': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => {
        const { totalCalories, totalProtein, totalCarbs, totalFat } = calculateTotals(entry);
        const mealType = getMealTypeFromEntry?.(entry) || entry.meal_type || 'Unknown';
        const vegData = calculateVegetarianPercentage(entry);
        
        return (
          <Card 
            key={entry.id} 
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
            onClick={() => onView(entry.id)}
          >
            <div className="relative">
              {entry.image_url && (
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  <img 
                    src={entry.image_url} 
                    alt="Food" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge className={`${getMealTypeColor(mealType)} text-xs font-medium shadow-sm`}>
                  {mealType}
                </Badge>
                {vegData.isVegetarian && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-medium shadow-sm">
                    <Leaf className="w-3 h-3 mr-1" />
                    {vegData.isVegan ? 'Vegan' : 'Vegetarian'}
                  </Badge>
                )}
              </div>
              {!entry.image_url && (
                <div className="aspect-video w-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <Utensils className="h-12 w-12 text-green-400" />
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {entry.description || 'No description available'}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.created_at), 'MMM dd, h:mm a')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-3 w-3 text-orange-500" />
                    <span className="text-lg font-bold text-orange-600">{Math.round(totalCalories)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{Math.round(totalProtein)}g</div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600 font-medium">{Math.round(totalCarbs)}g carbs</span>
                  <span className="text-purple-600 font-medium">{Math.round(totalFat)}g fat</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(entry.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      disabled={deletingId === entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
