import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Utensils, Calendar, User, AlertCircle, Stethoscope } from "lucide-react";
import { CaretakerDataProvider, useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { format } from 'date-fns';
import { ImageModal } from "@/components/ui/image-modal";

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

const CaretakerFoodDetailsContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading: contextLoading } = useCaretakerData();
  const { hasPermission, loading: permissionLoading } = usePermissionStatus(selectedParticipantId);
  const [foodEntry, setFoodEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoodEntry = async () => {
      if (!selectedParticipantId || !id) {
        setLoading(false);
        return;
      }

      // Wait for permissions to load before checking them
      if (permissionLoading) {
        return;
      }

      // If we don't have permission, stop loading
      if (!hasPermission('food_entries')) {
        setLoading(false);
        return;
      }

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

    fetchFoodEntry();
  }, [selectedParticipantId, id, permissionLoading]); // Removed hasPermission from dependencies

  const getMealType = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  if (contextLoading || permissionLoading || loading) {
    return (
      <div className="nw-page-container flex items-center justify-center">
        <Card className="nw-card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading food entry details...</p>
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
              <Button onClick={() => navigate('/caretaker')} className="nw-button-modern">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasPermission('food_entries')) {
    return (
      <div className="nw-page-container">
        <div className="nw-content-wrapper">
          {/* Page Header */}
          <div className="nw-page-header">
            <div>
              <h1 className="nw-page-title flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
                Food Entry Details
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Stethoscope className="h-4 w-4" />
                <span className="font-medium">{participantData.full_name}</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/food')}
              className="nw-button-outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Food Entries
            </Button>
          </div>

          <Card className="nw-card-modern">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-amber-600" />
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
        </div>
      </div>
    );
  }

  if (!foodEntry) {
    return (
      <div className="nw-page-container">
        <div className="nw-content-wrapper">
          {/* Page Header */}
          <div className="nw-page-header">
            <div>
              <h1 className="nw-page-title flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
                Food Entry Details
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Stethoscope className="h-4 w-4" />
                <span className="font-medium">{participantData.full_name}</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/food')}
              className="nw-button-outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Food Entries
            </Button>
          </div>

          <Card className="nw-card-modern">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Food Entry Not Found</CardTitle>
              <CardDescription className="text-lg">
                The requested food entry could not be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="nw-page-container">
      <div className="nw-content-wrapper">
        {/* Page Header */}
        <div className="nw-page-header">
          <div>
            <h1 className="nw-page-title flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Utensils className="h-7 w-7 text-white" />
              </div>
              Food Entry Details
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <Stethoscope className="h-4 w-4" />
              <span className="font-medium">{participantData.full_name}</span>
              <span className="text-gray-400">•</span>
              <span>{format(new Date(foodEntry.created_at), 'MMM dd, yyyy - h:mm a')}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/caretaker/food')}
            className="nw-button-outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Food Entries
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Food Image */}
          {foodEntry.image_url && (
            <Card className="nw-card-modern lg:col-span-1">
              <CardContent className="p-6">
                <ImageModal 
                  src={foodEntry.image_url} 
                  alt="Food entry" 
                  className="w-full rounded-lg aspect-square object-cover"
                />
              </CardContent>
            </Card>
          )}

          {/* Main Details */}
          <Card className={`nw-card-modern ${foodEntry.image_url ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(foodEntry.created_at), 'MMMM dd, yyyy - h:mm a')}
                </CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {getMealType(foodEntry)}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {foodEntry.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Nutrition Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="nw-stat-card">
                  <div className="text-2xl font-bold text-orange-600">{foodEntry.calories || 0}</div>
                  <div className="text-sm text-gray-500">Calories</div>
                </div>
                <div className="nw-stat-card">
                  <div className="text-2xl font-bold text-blue-600">{foodEntry.total_protein?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Protein</div>
                </div>
                <div className="nw-stat-card">
                  <div className="text-2xl font-bold text-green-600">{foodEntry.total_carbohydrates?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Carbs</div>
                </div>
                <div className="nw-stat-card">
                  <div className="text-2xl font-bold text-purple-600">{foodEntry.total_fats?.toFixed(1) || 0}g</div>
                  <div className="text-sm text-gray-500">Fat</div>
                </div>
              </div>
              
              {(foodEntry.total_fiber || foodEntry.total_sodium) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {foodEntry.total_fiber && (
                    <div className="nw-stat-card">
                      <div className="text-lg font-semibold">{foodEntry.total_fiber.toFixed(1)}g</div>
                      <div className="text-sm text-gray-500">Fiber</div>
                    </div>
                  )}
                  {foodEntry.total_sodium && (
                    <div className="nw-stat-card">
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
            <Card className="nw-card-modern lg:col-span-3">
              <CardHeader>
                <CardTitle>Food Items</CardTitle>
                <CardDescription>
                  Individual items identified in this meal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {foodEntry.food_items.map((item) => (
                    <div key={item.id} className="nw-card-clinical p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        {item.serving_size && (
                          <Badge variant="secondary">{item.serving_size}</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
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
    </div>
  );
};

const CaretakerFoodDetails = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerFoodDetails: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="nw-page-container flex items-center justify-center">
          <Card className="nw-card-modern max-w-md">
            <CardContent className="p-8 text-center">
              <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading food entry details...</p>
            </CardContent>
          </Card>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType !== 'caretaker') {
    return null;
  }

  return (
    <CaretakerDataProvider>
      <SimpleRoleBasedLayout>
        <CaretakerFoodDetailsContent />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default CaretakerFoodDetails;
