import React, { memo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Flame, Calendar, Utensils } from "lucide-react";
import { calculateDetailedDietaryBreakdown, getDietaryDisplayBadges } from "@/utils/vegetarianUtils";
import { LazyThumbnail } from "@/components/ui/lazy-image";

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

// Memoized date formatter
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Memoized calorie calculator
const getCaloriesFromEntry = (entry: FoodEntry) => {
  const extractedCalories = entry.extracted_nutrients?.meal_summary?.total_nutrition?.calories ||
                           entry.extracted_nutrients?.calories;

  if (extractedCalories) return Math.round(extractedCalories);
  if (entry.calories) return Math.round(entry.calories);
  return 0;
};

// Memoized component with custom comparison
export const FoodCardOptimized = memo(({
  entry,
  onView,
  onDelete,
  getMealTypeFromEntry
}: FoodCardProps) => {

  // Memoize callbacks to prevent unnecessary re-renders
  const handleView = useCallback(() => {
    onView(entry.id);
  }, [onView, entry.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  }, [onDelete, entry.id]);

  const mealType = getMealTypeFromEntry(entry);
  const calories = getCaloriesFromEntry(entry);
  const dietaryBreakdown = calculateDetailedDietaryBreakdown(entry);
  const dietBadges = getDietaryDisplayBadges(dietaryBreakdown);

  // Memoized meal type color
  const getMealTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-blue-100 text-blue-800';
      case 'dinner': return 'bg-purple-100 text-purple-800';
      case 'snack': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 overflow-hidden"
      onClick={handleView}
    >
      <div className="relative">
        {/* Lazy loaded image with placeholder */}
        {entry.image_url && (
          <LazyThumbnail
            src={entry.image_url}
            alt={entry.description || 'Food image'}
            className="w-full h-48 object-cover"
            placeholderClassName="bg-gradient-to-br from-gray-200 to-gray-300"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className={getMealTypeColor(mealType)}>
            <Utensils className="h-3 w-3 mr-1" />
            {mealType}
          </Badge>
        </div>

        {/* Diet badges */}
        {dietBadges.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {dietBadges.slice(0, 2).map((badge, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={badge.className}
              >
                {badge.icon}
                {badge.text}
              </Badge>
            ))}
          </div>
        )}

        {/* Calorie badge */}
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-white/90 text-orange-600 backdrop-blur-sm">
            <Flame className="h-3 w-3 mr-1" />
            {calories} cal
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {entry.description || `${mealType} Entry`}
          </h3>
        </div>

        {/* Date */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(entry.created_at)}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-sm font-semibold text-blue-700">
              {Math.round(entry.total_protein || 0)}g
            </div>
            <div className="text-xs text-blue-600">Protein</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-sm font-semibold text-yellow-700">
              {Math.round(entry.total_carbohydrates || 0)}g
            </div>
            <div className="text-xs text-yellow-600">Carbs</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="text-sm font-semibold text-purple-700">
              {Math.round(entry.total_fats || 0)}g
            </div>
            <div className="text-xs text-purple-600">Fat</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific props change
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.description === nextProps.entry.description &&
    prevProps.entry.calories === nextProps.entry.calories &&
    prevProps.entry.image_url === nextProps.entry.image_url &&
    prevProps.onView === nextProps.onView &&
    prevProps.onDelete === nextProps.onDelete
  );
});

FoodCardOptimized.displayName = 'FoodCardOptimized';