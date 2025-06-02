import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Utensils, Flame, Calendar, Clock, TrendingUp, Heart, Apple, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { NutritionDisplay } from "@/components/food/NutritionDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { FoodDetailsSidebar } from "@/components/food/FoodDetailsSidebar";
import { EnhancedNutritionDisplay } from "@/components/food/EnhancedNutritionDisplay";

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  ingredients: any;
  extracted_nutrients: any;
  image_url: string;
  created_at: string;
}

const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [foodEntry, setFoodEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FoodEntry>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (id) {
      fetchFoodEntry();
    }
  }, [id, user, navigate]);

  const fetchFoodEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setFoodEntry(data);
      setEditedData(data);
    } catch (error: any) {
      console.error('Error fetching food entry:', error);
      toast.error("Failed to load food entry");
      navigate("/food");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .update(editedData)
        .eq('id', id);

      if (error) throw error;

      setFoodEntry({ ...foodEntry!, ...editedData });
      setEditing(false);
      toast.success("Food entry updated successfully");
    } catch (error: any) {
      console.error('Error updating food entry:', error);
      toast.error("Failed to update food entry");
    }
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

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading food entry...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!foodEntry) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Food entry not found</div>
        </div>
      </SidebarLayout>
    );
  }

  const nutritionData = foodEntry.extracted_nutrients;
  const mealSummary = nutritionData?.meal_summary;
  const totalNutrition = mealSummary?.total_nutrition;
  const healthAssessment = nutritionData?.health_assessment;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => navigate("/food")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Utensils className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {mealSummary?.meal_type || 'Food Entry'}
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
                        {foodEntry.calories || totalNutrition?.calories || 0} cal
                      </span>
                      {mealSummary?.classification_confidence && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {Math.round(mealSummary.classification_confidence * 100)}% confident
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {setEditing(false); setEditedData(foodEntry);}}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Compact */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Food Image */}
                {foodEntry.image_url && (
                  <Card>
                    <CardContent className="p-4">
                      <img
                        src={foodEntry.image_url}
                        alt="Food"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Sidebar */}
                <FoodDetailsSidebar 
                  totalNutrition={totalNutrition}
                  mealSummary={mealSummary}
                  healthAssessment={healthAssessment}
                />
              </div>
            </div>

            {/* Right Content - Main */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                  <TabsTrigger value="health">Health & Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editing ? (
                        <Textarea
                          value={editedData.description || ''}
                          onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                          className="min-h-[100px]"
                          placeholder="Describe your food..."
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                          <p className="text-gray-900">{foodEntry.description || 'No description provided'}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dishes */}
                  {mealSummary?.dish_names && mealSummary.dish_names.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Apple className="h-5 w-5 text-green-600" />
                          Dishes Identified
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {mealSummary.dish_names.map((dish: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                              {dish}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Meal Context & Suggestion */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {mealSummary?.time && mealSummary?.date && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Meal Context</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium">{mealSummary.date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium">{mealSummary.time}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium">{mealSummary.meal_type}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {mealSummary?.meal_suggestion && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Suggestion</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-green-700">{mealSummary.meal_suggestion}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="nutrition">
                  {nutritionData ? (
                    <EnhancedNutritionDisplay nutritionData={nutritionData} />
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No nutrition data available</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="health">
                  <div className="space-y-6">
                    {/* Health Assessment */}
                    {healthAssessment && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {healthAssessment.diabetes && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-orange-600" />
                                Diabetes Assessment
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Rating:</span>
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                    {healthAssessment.diabetes.rating}
                                  </Badge>
                                </div>
                                <p className="text-orange-700">{healthAssessment.diabetes.suggestion}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {healthAssessment.hypertension && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-red-600" />
                                Hypertension Assessment
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-red-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Rating:</span>
                                  <Badge variant="outline" className="bg-red-100 text-red-700">
                                    {healthAssessment.hypertension.rating}
                                  </Badge>
                                </div>
                                <p className="text-red-700">{healthAssessment.hypertension.suggestion}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Nutrition Focus */}
                    {nutritionData?.nutrition_focus && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Nutrition Focus</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {nutritionData.nutrition_focus.nutrients_high && nutritionData.nutrition_focus.nutrients_high.length > 0 && (
                            <div>
                              <h4 className="font-medium text-red-600 mb-2">High Nutrients:</h4>
                              <div className="flex flex-wrap gap-2">
                                {nutritionData.nutrition_focus.nutrients_high.map((nutrient: string, index: number) => (
                                  <Badge key={index} variant="destructive">{nutrient}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {nutritionData.nutrition_focus.nutrients_low && nutritionData.nutrition_focus.nutrients_low.length > 0 && (
                            <div>
                              <h4 className="font-medium text-yellow-600 mb-2">Low Nutrients:</h4>
                              <div className="flex flex-wrap gap-2">
                                {nutritionData.nutrition_focus.nutrients_low.map((nutrient: string, index: number) => (
                                  <Badge key={index} variant="outline" className="border-yellow-500 text-yellow-600">{nutrient}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {nutritionData.nutrition_focus.suggestion && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-medium text-blue-700 mb-2">Nutrition Suggestion</h4>
                              <p className="text-blue-600">{nutritionData.nutrition_focus.suggestion}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Calorie Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Calorie Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {editing ? (
                          <Input
                            type="number"
                            value={editedData.calories || 0}
                            onChange={(e) => setEditedData({ ...editedData, calories: parseInt(e.target.value) || 0 })}
                            placeholder="Enter calories..."
                          />
                        ) : (
                          <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-4">
                            <Flame className="h-6 w-6 text-orange-500" />
                            <span className="text-xl font-semibold text-orange-700">{foodEntry.calories || 0} calories</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default FoodDetails;
