
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import ModernFoodTable from "@/components/caretaker/ModernFoodTable";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, RefreshCw, User, AlertCircle } from "lucide-react";
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

  const handleViewEntry = (id: string) => {
    navigate(`/caretaker/food/${id}`);
  };

  if (contextLoading || permissionLoading) {
    return (
      <RoleBasedLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading participant food entries...</p>
            </CardContent>
          </Card>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <RoleBasedLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
          <Card className="max-w-2xl mx-auto mt-12">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">No Participant Selected</CardTitle>
              <CardDescription className="text-lg">
                Please select a participant from the sidebar to view their food entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/caretaker')} className="bg-gradient-to-r from-orange-500 to-red-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
                <Utensils className="h-10 w-10 text-orange-600" />
                Food Monitoring
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{participantData.full_name}</span>
                <span className="text-gray-400">•</span>
                <span>Track nutrition and eating patterns</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0">
              {hasPermission('food_entries') && (
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/caretaker')}
                className="flex items-center gap-2 bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {!hasPermission('food_entries') ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Access Permission Required</CardTitle>
                <CardDescription className="text-lg">
                  {participantData.full_name} needs to grant you permission to view their food entries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionStatusIndicator
                  hasPermissions={false}
                  participantName={participantData.full_name}
                  missingCategories={['food_entries']}
                />
              </CardContent>
            </Card>
          ) : (
            <ModernFoodTable 
              entries={foodEntries}
              onView={handleViewEntry}
              getMealTypeFromEntry={getMealTypeFromEntry}
              participantName={participantData.full_name}
            />
          )}
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerFood;
