
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Utensils, Calendar, User, AlertCircle, Stethoscope, Flame, Clock, Apple, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { CaretakerDataProvider, useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { format } from 'date-fns';
import { ImageModal } from "@/components/ui/image-modal";
import { HealthImpact } from "@/components/food/HealthImpact";
import CommentsSection from "@/components/caretaker/CommentsSection";

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
  meal_time: string;
  meal_date: string;
  confidence_score: number;
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
  const [showAllItems, setShowAllItems] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

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
  }, [selectedParticipantId, id, permissionLoading]);

  const fetchCommentCount = async () => {
    if (!selectedParticipantId || !id) return;

    try {
      const { count, error } = await supabase
        .from('participant_comments')
        .select('*', { count: 'exact', head: true })
        .eq('participant_id', selectedParticipantId)
        .eq('content_type', 'food_entry')
        .eq('content_id', id);

      if (error) throw error;
      setCommentCount(count || 0);
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };

  useEffect(() => {
    if (selectedParticipantId && id) {
      fetchCommentCount();
    }
  }, [selectedParticipantId, id]);

  const getCaloriesFromData = (entry: FoodEntry) => {
    return entry.calories || 
           entry.extracted_nutrients?.meal_summary?.total_nutrition?.calories || 
           entry.extracted_nutrients?.calories || 0;
  };

  const getNutritionFromData = (entry: FoodEntry) => {
    const extracted = entry.extracted_nutrients;
    const totalNutrition = extracted?.meal_summary?.total_nutrition;
    
    return {
      calories: getCaloriesFromData(entry),
      proteins: entry.total_protein || totalNutrition?.proteins || 0,
      carbohydrates: entry.total_carbohydrates || totalNutrition?.carbohydrates || 0,
      fats: entry.total_fats || totalNutrition?.fats || 0,
      fiber: entry.total_fiber || totalNutrition?.fiber || 0,
      sodium: entry.total_sodium || totalNutrition?.sodium || 0,
    };
  };

  const getDishNames = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.dish_names || 
           entry.extracted_nutrients?.dish_names || [];
  };

  const getFoodItems = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.food_items || [];
  };

  const getMealType = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const nutrition = getNutritionFromData(foodEntry);
  const dishNames = getDishNames(foodEntry);
  const foodItems = getFoodItems(foodEntry);
  const visibleItems = showAllItems ? foodItems : foodItems.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/caretaker/food")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Utensils className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {getMealType(foodEntry)} - {participantData.full_name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(foodEntry.created_at)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(foodEntry.created_at)}
                    </span>
                    <span className="flex items-center font-semibold text-orange-600">
                      <Flame className="h-3 w-3 mr-1" />
                      {nutrition.calories} cal
                    </span>
                    {foodEntry.confidence_score && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {Math.round(foodEntry.confidence_score * 100)}% confident
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Food Image */}
              {foodEntry.image_url && (
                <Card>
                  <CardContent className="p-4">
                    <ImageModal
                      src={foodEntry.image_url}
                      alt="Food"
                      className="w-full h-64"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Nutrition Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nutrition Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{nutrition.calories}</div>
                      <div className="text-xs text-gray-600">Calories</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{nutrition.proteins}g</div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">{nutrition.carbohydrates}g</div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{nutrition.fats}g</div>
                      <div className="text-xs text-gray-600">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="meal-analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="meal-analysis">Meal Analysis</TabsTrigger>
                <TabsTrigger value="health-impact">Health Impact</TabsTrigger>
                <TabsTrigger value="comments" className="relative">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                  {commentCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {commentCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="meal-analysis" className="space-y-6">
                {/* Dishes */}
                {dishNames.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Apple className="h-5 w-5 text-green-600" />
                        Identified Dishes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {dishNames.map((dish: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                            {dish}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {foodEntry.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{foodEntry.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Food Items */}
                {foodItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Individual Items ({foodItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {visibleItems.map((item: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-600">{item.serving_size}</p>
                              </div>
                              <div className="flex gap-1">
                                {item.flags?.vegetarian && <Badge variant="outline" className="text-green-600 text-xs">Veg</Badge>}
                                {item.flags?.contains_allergens && <Badge variant="destructive" className="text-xs">Allergens</Badge>}
                              </div>
                            </div>
                            
                            {item.nutrition_values && (
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{item.nutrition_values.calories || 0}</div>
                                  <div className="text-gray-500">cal</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{item.nutrition_values.proteins || 0}g</div>
                                  <div className="text-gray-500">protein</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{item.nutrition_values.carbohydrates || 0}g</div>
                                  <div className="text-gray-500">carbs</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {foodItems.length > 4 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllItems(!showAllItems)}
                            className="w-full"
                          >
                            {showAllItems ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Show {foodItems.length - 4} More Items
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="health-impact">
                <HealthImpact extractedNutrients={foodEntry.extracted_nutrients} />
              </TabsContent>

              <TabsContent value="comments">
                <CommentsSection
                  participantId={selectedParticipantId || ''}
                  contentType="food_entry"
                  contentId={id}
                  isCaretaker={true}
                />
              </TabsContent>
            </Tabs>
          </div>
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
