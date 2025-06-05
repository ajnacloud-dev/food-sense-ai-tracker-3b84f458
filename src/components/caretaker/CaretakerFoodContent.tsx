
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
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
      <div className="nw-page-container flex items-center justify-center">
        <Card className="nw-card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading participant food entries...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <div className="nw-page-container">
        <div className="nw-content-wrapper">
          <Card className="nw-card-modern max-w-2xl mx-auto mt-12">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">No Participant Selected</CardTitle>
              <CardDescription className="text-lg">
                Please select a participant from the sidebar to view their food entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleBack} className="nw-button-modern">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="nw-page-container">
      <div className="nw-content-wrapper">
        <CaretakerFoodHeader
          participantName={participantData.full_name}
          hasPermission={hasPermission('food_entries')}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onBack={handleBack}
        />

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
