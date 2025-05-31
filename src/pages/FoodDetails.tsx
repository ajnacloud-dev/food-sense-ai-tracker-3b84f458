
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit, Save, X, Utensils, Flame, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { NutritionDisplay } from "@/components/food/NutritionDisplay";
import { useAuth } from "@/contexts/AuthContext";

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

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/food")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Utensils className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Food Details</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(foodEntry.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(foodEntry.created_at)}</span>
                    </div>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-6">
            {/* Image */}
            {foodEntry.image_url && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={foodEntry.image_url}
                    alt="Food"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  {editing ? (
                    <Textarea
                      value={editedData.description || ''}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                      className="min-h-[100px]"
                      placeholder="Describe your food..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
                      <p className="text-gray-900">{foodEntry.description || 'No description provided'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Calories</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editedData.calories || 0}
                      onChange={(e) => setEditedData({ ...editedData, calories: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-3">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="text-lg font-semibold text-orange-700">{foodEntry.calories || 0} calories</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Nutrition Data */}
          <div className="lg:col-span-2">
            {foodEntry.extracted_nutrients && (
              <NutritionDisplay nutritionData={foodEntry.extracted_nutrients} />
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default FoodDetails;
