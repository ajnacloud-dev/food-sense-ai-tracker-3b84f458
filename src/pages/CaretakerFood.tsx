
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import FoodTable from "@/components/food/FoodTable";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, RefreshCw } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";

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

const CaretakerFood = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading: contextLoading } = useCaretakerData();
  const { hasPermission, missingPermissions, loading: permissionLoading } = usePermissionStatus(selectedParticipantId);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedParticipantId && hasPermission('food_entries')) {
      fetchFoodEntries();
    } else {
      setLoading(false);
    }
  }, [selectedParticipantId, hasPermission]);

  const fetchFoodEntries = async () => {
    if (!selectedParticipantId) return;

    try {
      setRefreshing(true);
      console.log('CaretakerFood: Fetching food entries for participant:', selectedParticipantId);
      
      const { data: foodData, error: foodError } = await supabase
        .from('food_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('user_id', selectedParticipantId)
        .order('created_at', { ascending: false });

      if (foodError) {
        console.error('CaretakerFood: Error fetching food entries:', foodError);
        if (foodError.message.includes('policy')) {
          toast.error('Access denied. Participant needs to grant permissions.');
        } else {
          throw foodError;
        }
        return;
      }

      console.log('CaretakerFood: Found food entries:', foodData?.length || 0);
      setFoodEntries(foodData || []);
    } catch (error) {
      console.error('CaretakerFood: Error:', error);
      toast.error("Failed to load food entries");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchFoodEntries();
    toast.success("Food entries refreshed");
  };

  const getMealTypeFromEntry = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  if (contextLoading || permissionLoading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading participant food entries...</p>
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

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              Food Entries - {participantData.full_name}
            </h1>
            <p className="text-gray-600">Monitor participant's nutrition and food intake</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('food_entries') && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {!hasPermission('food_entries') ? (
          <PermissionStatusIndicator
            hasPermissions={false}
            participantName={participantData.full_name}
            missingCategories={['food_entries']}
          />
        ) : (
          <FoodTable 
            entries={foodEntries}
            onView={(id) => navigate(`/food/${id}`)}
            getMealTypeFromEntry={getMealTypeFromEntry}
          />
        )}
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerFood;
