
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Utensils, Clock, MapPin, Leaf, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { EnhancedNutritionDisplay } from "@/components/food/EnhancedNutritionDisplay";
import CommentsSection from "./CommentsSection";
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
  const { selectedParticipantId, participantData } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && selectedParticipantId && hasPermission('food_entries')) {
      fetchFoodEntry();
    } else {
      setLoading(false);
    }
  }, [id, selectedParticipantId, hasPermission]);

  const fetchFoodEntry = async () => {
    if (!id || !selectedParticipantId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
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
          toast.error('Food entry not found');
          navigate('/caretaker/food');
          return;
        }
        throw error;
      }

      setEntry(data);
    } catch (error) {
      console.error('Error fetching food entry:', error);
      toast.error('Failed to load food entry');
      navigate('/caretaker/food');
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeFromEntry = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
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

  const handleBack = () => {
    navigate('/caretaker/food');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading food details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entry || !selectedParticipantId || !hasPermission('food_entries')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Entry Not Found</h3>
            <p className="text-gray-600 mb-6">This food entry doesn't exist or you don't have permission to view it.</p>
            <Button onClick={handleBack} className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Food List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mealType = getMealTypeFromEntry(entry);
  const vegData = calculateVegetarianPercentage(entry);
  const healthScore = calculateHealthScore(entry);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Food Entry Details</h1>
                  <p className="text-green-100 text-lg">Patient: {participantData?.full_name}</p>
                </div>
              </div>
              <Button 
                onClick={handleBack}
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Image and Basic Info */}
            <Card className="border-green-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="space-y-4">
                    {entry.image_url ? (
                      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-inner">
                        <img 
                          src={entry.image_url} 
                          alt="Food" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center shadow-inner">
                        <Utensils className="h-16 w-16 text-green-400" />
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
                        <Badge className={`${getMealTypeColor(mealType)} font-medium`}>
                          {mealType}
                        </Badge>
                        {vegData.isVegetarian && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
                            <Leaf className="w-3 h-3 mr-1" />
                            {vegData.isVegan ? 'Vegan' : 'Vegetarian'}
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
                        
                        <div className="flex items-center gap-2 text-green-600">
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
            <Card className="border-green-200/50 shadow-lg">
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
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Overall Health Score</h3>
                      <p className="text-sm text-gray-600">Based on nutritional balance</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{healthScore}/100</div>
                      <div className="text-xs text-gray-500">
                        {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
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
              <Card className="border-green-200/50 shadow-lg">
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
      </div>
    </div>
  );
};

export default EnhancedCaretakerFoodDetails;
