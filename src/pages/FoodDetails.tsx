
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Utensils, Flame, Calendar, Clock, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ImageModal } from "@/components/ui/image-modal";
import { NutritionProgress } from "@/components/food/NutritionProgress";
import { HealthImpact } from "@/components/food/HealthImpact";

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
      fetchFoodDetails();
    }
  }, [id, user, navigate]);

  const fetchFoodDetails = async () => {
    if (!user) return;

    try {
      const { data: entry, error: entryError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (entryError) throw entryError;

      setFoodEntry(entry);
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

  const nutrition = getNutritionFromData(foodEntry);
  const dishNames = getDishNames(foodEntry);
  const foodItems = getFoodItems(foodEntry);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

                {/* Quick Stats */}
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="meal-analysis">Meal Analysis</TabsTrigger>
                  <TabsTrigger value="health-impact">Health Impact</TabsTrigger>
                </TabsList>

                <TabsContent value="meal-analysis" className="space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editing ? (
                        <Textarea
                          value={editedData.description || ''}
                          onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                          className="min-h-[80px]"
                          placeholder="Describe your food..."
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                          <p className="text-gray-900">{foodEntry.description || 'No description provided'}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

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

                  {/* Detailed Nutrition */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Nutrition Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <NutritionProgress nutrition={nutrition} />
                    </CardContent>
                  </Card>

                  {/* Food Items */}
                  {foodItems.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Individual Items ({foodItems.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {foodItems.map((item: any, index: number) => (
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
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="health-impact">
                  <HealthImpact extractedNutrients={foodEntry.extracted_nutrients} />
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
