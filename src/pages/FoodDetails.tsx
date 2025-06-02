
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Utensils, Flame, Calendar, Clock, Heart, Apple, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedNutritionDisplay } from "@/components/food/EnhancedNutritionDisplay";

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
}

interface FoodItem {
  id: string;
  name: string;
  serving_size: string;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  sodium: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  contains_allergens: boolean;
}

interface HealthAssessment {
  diabetes_rating: string;
  diabetes_suggestion: string;
  hypertension_rating: string;
  hypertension_suggestion: string;
  general_suggestion: string;
  nutrients_high: string[];
  nutrients_low: string[];
}

interface MealSummary {
  dish_names: string[];
  meal_suggestion: string;
  classification_confidence: number;
}

const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [foodEntry, setFoodEntry] = useState<FoodEntry | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [healthAssessment, setHealthAssessment] = useState<HealthAssessment | null>(null);
  const [mealSummary, setMealSummary] = useState<MealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FoodEntry>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (id) {
      fetchFoodDetails();
    }
  }, [id, user, navigate]);

  const fetchFoodDetails = async () => {
    if (!user) return;

    try {
      // Fetch main food entry
      const { data: entry, error: entryError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (entryError) throw entryError;

      // Fetch related food items
      const { data: items, error: itemsError } = await supabase
        .from('food_items')
        .select('*')
        .eq('food_entry_id', id);

      if (itemsError) console.error('Error fetching food items:', itemsError);

      // Fetch health assessment
      const { data: health, error: healthError } = await supabase
        .from('health_assessments')
        .select('*')
        .eq('food_entry_id', id)
        .single();

      if (healthError && healthError.code !== 'PGRST116') {
        console.error('Error fetching health assessment:', healthError);
      }

      // Fetch meal summary
      const { data: summary, error: summaryError } = await supabase
        .from('meal_summaries')
        .select('*')
        .eq('food_entry_id', id)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching meal summary:', summaryError);
      }

      setFoodEntry(entry);
      setFoodItems(items || []);
      setHealthAssessment(health);
      setMealSummary(summary);
      setEditedData(entry);
    } catch (error: any) {
      console.error('Error fetching food details:', error);
      toast.error("Failed to load food details");
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
          <div className="text-lg">Loading food details...</div>
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
                      {foodEntry.meal_type || 'Food Entry'}
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
                        {foodEntry.calories || 0} cal
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
            {/* Left Sidebar */}
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

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nutrition Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Calories:</span>
                      <span className="font-medium">{foodEntry.calories || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Protein:</span>
                      <span className="font-medium">{foodEntry.total_protein || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Carbs:</span>
                      <span className="font-medium">{foodEntry.total_carbohydrates || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fats:</span>
                      <span className="font-medium">{foodEntry.total_fats || 0}g</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Content */}
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
                </TabsContent>

                <TabsContent value="nutrition">
                  {/* Use the enhanced display with normalized data */}
                  <EnhancedNutritionDisplay 
                    nutritionData={{
                      meal_summary: {
                        total_nutrition: {
                          calories: foodEntry.calories,
                          proteins: foodEntry.total_protein,
                          carbohydrates: foodEntry.total_carbohydrates,
                          fats: foodEntry.total_fats,
                          fiber: foodEntry.total_fiber,
                          sodium: foodEntry.total_sodium
                        }
                      },
                      food_items: foodItems
                    }} 
                  />
                </TabsContent>

                <TabsContent value="health">
                  <div className="space-y-6">
                    {/* Health Assessment */}
                    {healthAssessment && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {healthAssessment.diabetes_rating && (
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
                                    {healthAssessment.diabetes_rating}
                                  </Badge>
                                </div>
                                <p className="text-orange-700">{healthAssessment.diabetes_suggestion}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {healthAssessment.hypertension_rating && (
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
                                    {healthAssessment.hypertension_rating}
                                  </Badge>
                                </div>
                                <p className="text-red-700">{healthAssessment.hypertension_suggestion}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
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
