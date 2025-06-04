
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Utensils, Calendar, User } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { format } from 'date-fns';

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
  food_items: FoodItem[];
}

interface FoodItem {
  id: string;
  name: string;
  calories?: number;
  proteins?: number;
  carbohydrates?: number;
  fats?: number;
  serving_size?: string;
  quantity?: number;
}

const CaretakerFoodDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  const [foodEntry, setFoodEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedParticipantId && hasPermission('food_entries') && id) {
      fetchFoodEntry();
    } else {
      setLoading(false);
    }
  }, [selectedParticipantId, hasPermission, id]);

  const fetchFoodEntry = async () => {
    if (!selectedParticipantId || !id) return;

    try {
      setLoading(true);
      console.log('CaretakerFoodDetails: Fetching food entry:', id, 'for participant:', selectedParticipantId);
      
      const { data: foodData, error } = await supabase
        .from('food_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('id', id)
        .eq('user_id', selectedParticipantId)
        .single();

      if (error) {
        console.error('CaretakerFoodDetails: Error fetching food entry:', error);
        if (error.message.includes('policy')) {
          toast.error('Access denied. Participant needs to grant permissions.');
        } else {
          throw error;
        }
        return;
      }

      console.log('CaretakerFoodDetails: Found food entry:', foodData);
      setFoodEntry(foodData);
    } catch (error) {
      console.error('CaretakerFoodDetails: Error:', error);
      toast.error("Failed to load food entry details");
    } finally {
      setLoading(false);
    }
  };

  const getMealType = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading food entry details...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <RoleBasedLayout>
        <Card>
          <CardHeader>
            <CardTitle>No Participant Selected</CardTitle>
            <CardDescription>
              Please select a participant from the sidebar to view their food entries.
            </CardDescription>
          </CardHeader>
        </Card>
      </RoleBasedLayout>
    );
  }

  if (!hasPermission('food_entries')) {
    return (
      <RoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              Food Entry Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/food')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Food Entries
            </Button>
          </div>
          
          <PermissionStatusIndicator
            hasPermissions={false}
            participantName={participantData.full_name}
            missingCategories={['food_entries']}
          />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!foodEntry) {
    return (
      <RoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              Food Entry Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/food')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Food Entries
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Food Entry Not Found</CardTitle>
              <CardDescription>
                The requested food entry could not be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              Food Entry Details
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <User className="h-4 w-4" />
              <span>{participantData.full_name}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/caretaker/food')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Food Entries
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Main Entry Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(foodEntry.created_at), 'MMMM dd, yyyy - h:mm a')}
                </CardTitle>
                <Badge variant="outline">
                  {getMealType(foodEntry)}
                </Badge>
              </div>
              <CardDescription>
                {foodEntry.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            {foodEntry.image_url && (
              <CardContent>
                <img 
                  src={foodEntry.image_url} 
                  alt="Food entry" 
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </CardContent>
            )}
          </Card>

          {/* Nutrition Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{foodEntry.calories || 0}</div>
                  <div className="text-sm text-gray-500">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{foodEntry.total_protein?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{foodEntry.total_carbohydrates?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{foodEntry.total_fats?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Fat</div>
                </div>
              </div>
              
              {(foodEntry.total_fiber || foodEntry.total_sodium) && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  {foodEntry.total_fiber && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{foodEntry.total_fiber.toFixed(1)}g</div>
                      <div className="text-sm text-gray-500">Fiber</div>
                    </div>
                  )}
                  {foodEntry.total_sodium && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">{foodEntry.total_sodium.toFixed(1)}mg</div>
                      <div className="text-sm text-gray-500">Sodium</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Items */}
          {foodEntry.food_items && foodEntry.food_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Food Items</CardTitle>
                <CardDescription>
                  Individual items identified in this meal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foodEntry.food_items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        {item.serving_size && (
                          <Badge variant="secondary">{item.serving_size}</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {item.calories && (
                          <div>
                            <span className="text-gray-500">Calories:</span> {item.calories}
                          </div>
                        )}
                        {item.proteins && (
                          <div>
                            <span className="text-gray-500">Protein:</span> {item.proteins}g
                          </div>
                        )}
                        {item.carbohydrates && (
                          <div>
                            <span className="text-gray-500">Carbs:</span> {item.carbohydrates}g
                          </div>
                        )}
                        {item.fats && (
                          <div>
                            <span className="text-gray-500">Fat:</span> {item.fats}g
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerFoodDetails;
