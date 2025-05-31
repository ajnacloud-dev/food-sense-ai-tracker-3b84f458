
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X, Utensils, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

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
  const [foodEntry, setFoodEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FoodEntry>>({});

  useEffect(() => {
    if (id) {
      fetchFoodEntry();
    }
  }, [id]);

  const fetchFoodEntry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

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

  const renderNutritionInfo = (nutrition: any) => {
    if (!nutrition) return null;

    if (nutrition.total_nutrition) {
      // New format from updated prompts
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{nutrition.total_nutrition.calories || 0}</div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{nutrition.total_nutrition.proteins || 0}g</div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{nutrition.total_nutrition.carbohydrates || 0}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{nutrition.total_nutrition.fats || 0}g</div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{nutrition.total_nutrition.fiber || 0}g</div>
            <div className="text-sm text-gray-600">Fiber</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{nutrition.total_nutrition.sodium || 0}mg</div>
            <div className="text-sm text-gray-600">Sodium</div>
          </div>
        </div>
      );
    }

    // Legacy format
    return (
      <div className="flex gap-2 flex-wrap">
        {nutrition.protein && <Badge variant="secondary">Protein: {nutrition.protein}g</Badge>}
        {nutrition.carbs && <Badge variant="secondary">Carbs: {nutrition.carbs}g</Badge>}
        {nutrition.fat && <Badge variant="secondary">Fat: {nutrition.fat}g</Badge>}
      </div>
    );
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

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/food")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Food
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Utensils className="h-8 w-8 text-green-500" />
                Food Details
              </h1>
              <p className="text-gray-600">View and edit your food entry</p>
            </div>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => {setEditing(false); setEditedData(foodEntry);}}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Image */}
        {foodEntry.image_url && (
          <Card>
            <CardContent className="p-6">
              <img
                src={foodEntry.image_url}
                alt="Food"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </CardContent>
          </Card>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              {editing ? (
                <Textarea
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 mt-1">{foodEntry.description}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Calories</label>
              {editing ? (
                <Input
                  type="number"
                  value={editedData.calories || 0}
                  onChange={(e) => setEditedData({ ...editedData, calories: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-900">{foodEntry.calories || 0} calories</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Information</CardTitle>
          </CardHeader>
          <CardContent>
            {renderNutritionInfo(foodEntry.extracted_nutrients)}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {foodEntry.extracted_nutrients?.meal_summary && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {foodEntry.extracted_nutrients.meal_summary.meal_suggestion && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Meal Suggestion</h4>
                  <p className="text-gray-700">{foodEntry.extracted_nutrients.meal_summary.meal_suggestion}</p>
                </div>
              )}
              {foodEntry.extracted_nutrients.nutrition_focus?.suggestion && (
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Nutrition Focus</h4>
                  <p className="text-gray-700">{foodEntry.extracted_nutrients.nutrition_focus.suggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
};

export default FoodDetails;
