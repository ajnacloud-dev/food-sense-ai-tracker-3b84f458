import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import ModernFoodTable from "@/components/caretaker/ModernFoodTable";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, RefreshCw, User, AlertCircle, Stethoscope } from "lucide-react";
import { CaretakerDataProvider, useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";

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
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchingRef = useRef(false);

  const fetchFoodEntries = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (fetchingRef.current && !forceRefresh) {
      console.log('CaretakerFood: Request already in progress, skipping...');
      return;
    }

    // Check prerequisites
    if (!selectedParticipantId) {
      console.log('CaretakerFood: No participant selected');
      setLoading(false);
      return;
    }

    if (permissionLoading) {
      console.log('CaretakerFood: Still loading permissions...');
      return;
    }

    if (!hasPermission('food_entries')) {
      console.log('CaretakerFood: No permission to view food entries');
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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

      console.log('CaretakerFood: Successfully fetched food entries:', foodData?.length || 0);
      setFoodEntries(foodData || []);
    } catch (error) {
      console.error('CaretakerFood: Error:', error);
      toast.error("Failed to load food entries");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedParticipantId, hasPermission, permissionLoading]);

  // Main effect for fetching data when conditions are met
  useEffect(() => {
    // Only fetch if we have all required data and permissions are loaded
    if (selectedParticipantId && !permissionLoading && hasPermission('food_entries')) {
      fetchFoodEntries();
    } else if (!permissionLoading) {
      // If permissions are loaded but we don't have access, stop loading
      setLoading(false);
    }
  }, [selectedParticipantId, permissionLoading, hasPermission]);

  const handleRefresh = async () => {
    await fetchFoodEntries(true);
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
              Food Monitoring
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <Stethoscope className="h-4 w-4" />
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
                className="nw-button-outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker')}
              className="nw-button-outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {!hasPermission('food_entries') ? (
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

const CaretakerFood = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerFood: User is not a caretaker, redirecting to /dashboard');
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
              <p className="text-gray-600 font-medium">Loading participant food entries...</p>
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
        <CaretakerFoodContent />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default CaretakerFood;
