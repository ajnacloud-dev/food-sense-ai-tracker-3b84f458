
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Utensils, Clock, MapPin, Leaf, Zap } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { EnhancedNutritionDisplay } from "@/components/food/EnhancedNutritionDisplay";
import CommentsSection from "./CommentsSection";
import DetailPageLayout from "./DetailPageLayout";
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";

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

// Simple health score calculation based on nutritional balance
const calculateHealthScore = (entry: FoodEntry): number => {
  const calories = entry.calories || 0;
  const protein = entry.total_protein || 0;
  const carbs = entry.total_carbohydrates || 0;
  const fats = entry.total_fats || 0;
  const fiber = entry.total_fiber || 0;
  const sodium = entry.total_sodium || 0;

  let score = 50; // Base score

  // Protein balance (aim for 15-30% of calories from protein)
  const proteinCalories = protein * 4;
  const proteinPercentage = calories > 0 ? (proteinCalories / calories) * 100 : 0;
  if (proteinPercentage >= 15 && proteinPercentage <= 30) score += 15;
  else if (proteinPercentage >= 10) score += 10;

  // Fiber content (good if > 3g per 100 calories)
  const fiberDensity = calories > 0 ? (fiber / calories) * 100 : 0;
  if (fiberDensity > 3) score += 15;
  else if (fiberDensity > 1.5) score += 10;

  // Sodium content (penalize high sodium)
  if (sodium > 2300) score -= 20;
  else if (sodium > 1500) score -= 10;
  else if (sodium < 500) score += 10;

  // Balance of macronutrients
  const totalMacroCalories = (protein * 4) + (carbs * 4) + (fats * 9);
  if (totalMacroCalories > 0) {
    const fatPercentage = (fats * 9 / totalMacroCalories) * 100;
    if (fatPercentage >= 20 && fatPercentage <= 35) score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const EnhancedCaretakerFoodDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading: contextLoading } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize permission check to prevent infinite loops
  const hasFoodPermission = useMemo(() => {
    return hasPermission('food_entries');
  }, [hasPermission]);

  // Wait for context to fully load before making any decisions
  const isContextReady = !contextLoading && selectedParticipantId && participantData;
  const shouldFetchData = isContextReady && hasFoodPermission && id;

  useEffect(() => {
    const fetchFoodEntry = async () => {
      if (!shouldFetchData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching food entry:', id, 'for participant:', selectedParticipantId);
        
        const { data, error } = await backendApi
          .from('food_entries')
          .select(`
            *,
            food_items (*)
          `)
          .eq('id', id)
          .eq('user_id', selectedParticipantId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Food entry not found or you don\'t have permission to view it.');
            return;
          }
          throw error;
        }

        console.log('Successfully fetched food entry:', data);
        setEntry(data);
      } catch (error) {
        console.error('Error fetching food entry:', error);
        setError('Failed to load food entry details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodEntry();
  }, [shouldFetchData, id, selectedParticipantId]);

  const handleBack = () => {
    navigate('/caretaker/food');
  };

  // Get error message based on the specific issue
  const getErrorMessage = () => {
    if (contextLoading) {
      return null; // Don't show error while context is loading
    }
    if (!selectedParticipantId || !participantData) {
      return 'No patient selected. Please select a patient from the sidebar.';
    }
    if (!hasFoodPermission) {
      return 'You don\'t have permission to view this patient\'s food entries.';
    }
    return error || 'Food entry not found.';
  };

  // Determine what to show
  const shouldShowContent = isContextReady && hasFoodPermission && !loading && entry;
  const shouldShowError = !contextLoading && !loading && (!isContextReady || !hasFoodPermission || (!entry && shouldFetchData));
  const shouldShowLoading = contextLoading || (isContextReady && loading);

  return (
    <DetailPageLayout
      title="Food Entry Details"
      subtitle={participantData ? `Patient: ${participantData.full_name}` : undefined}
      icon={Utensils}
      onBack={handleBack}
      backLabel="Back to Food List"
      isLoading={shouldShowLoading}
      error={shouldShowError ? getErrorMessage() : null}
      loadingMessage="Loading food details..."
    >
      {shouldShowContent && entry && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Image and Basic Info */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="space-y-4">
                    {entry.image_url ? (
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                        <img 
                          src={entry.image_url} 
                          alt="Food" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-gray-100 rounded-xl flex items-center justify-center">
                        <Utensils className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {entry.description || 'Food Entry'}
                      </h2>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="font-medium">
                          {entry.extracted_nutrients?.meal_summary?.meal_type || 
                           entry.extracted_nutrients?.meal_type || 
                           entry.meal_type || 
                           'unknown'}
                        </Badge>
                        {calculateVegetarianPercentage(entry).isVegetarian && (
                          <Badge variant="outline" className="text-green-700 border-green-200 font-medium">
                            <Leaf className="w-3 h-3 mr-1" />
                            {calculateVegetarianPercentage(entry).isVegan ? 'Vegan' : 'Vegetarian'}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(entry.created_at), 'EEEE, MMMM do, yyyy \'at\' h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-blue-600">
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">
                            {Math.round(entry.calories || 0)} calories
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Information */}
            <EnhancedNutritionDisplay 
              entry={entry} 
              showDetailedBreakdown={true}
            />

            {/* Health Impact */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">H</span>
                  </div>
                  Health Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Overall Health Score</h3>
                      <p className="text-sm text-gray-600">Based on nutritional balance</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{calculateHealthScore(entry)}/100</div>
                      <div className="text-xs text-gray-500">
                        {calculateHealthScore(entry) >= 80 ? 'Excellent' : 
                         calculateHealthScore(entry) >= 60 ? 'Good' : 
                         calculateHealthScore(entry) >= 40 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Comments Section */}
            <CommentsSection
              participantId={selectedParticipantId}
              contentType="food_entry"
              contentId={entry.id}
              isCaretaker={true}
            />

            {/* Food Items Details */}
            {entry.food_items && entry.food_items.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Food Items</CardTitle>
                  <CardDescription>Individual items in this meal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entry.food_items.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900 mb-1">
                          {item.name || `Item ${index + 1}`}
                        </div>
                        {item.serving_size && (
                          <div className="text-sm text-gray-600 mb-2">
                            Serving: {item.serving_size}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-orange-600 font-medium">
                            {Math.round(item.calories || 0)} cal
                          </div>
                          <div className="text-blue-600 font-medium">
                            {Math.round(item.proteins || 0)}g protein
                          </div>
                          <div className="text-green-600 font-medium">
                            {Math.round(item.carbohydrates || 0)}g carbs
                          </div>
                          <div className="text-purple-600 font-medium">
                            {Math.round(item.fats || 0)}g fat
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </DetailPageLayout>
  );
};

export default EnhancedCaretakerFoodDetails;
