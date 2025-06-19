
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Utensils } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { useFoodEntries } from "@/hooks/useFoodEntries";
import ModernFoodTable from "./ModernFoodTable";
import CaretakerFoodHeader from "./CaretakerFoodHeader";
import CaretakerFoodPermissionGuard from "./CaretakerFoodPermissionGuard";

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

const CaretakerFoodContent = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading: contextLoading } = useCaretakerData();
  const { hasPermission, missingPermissions, loading: permissionLoading } = usePermissionStatus(selectedParticipantId);
  
  const { foodEntries, loading, refreshing, handleRefresh } = useFoodEntries({
    selectedParticipantId,
    hasPermission,
    permissionLoading
  });

  const getMealTypeFromEntry = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  const handleViewEntry = (id: string) => {
    navigate(`/caretaker/food/${id}`);
  };

  const handleBack = () => {
    navigate('/caretaker');
  };

  if (contextLoading || permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading patient nutrition data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container mx-auto p-6">
          <Card className="max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <User className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-3xl text-gray-900">No Patient Selected</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Please select a patient from the sidebar to view their nutrition entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleBack} 
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-lg px-8 py-3"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Nutrition Monitoring</h1>
                  <p className="text-green-100 text-lg">Patient: {participantData.full_name}</p>
                </div>
              </div>
              <Button 
                onClick={handleBack}
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {!hasPermission('food_entries') ? (
          <CaretakerFoodPermissionGuard participantName={participantData.full_name} />
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
  );
};

export default CaretakerFoodContent;
