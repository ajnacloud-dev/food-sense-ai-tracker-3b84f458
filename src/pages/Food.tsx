import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Utensils, Calendar, Flame, Plus, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  ingredients: any;
  extracted_nutrients: any;
  image_url: string;
  created_at: string;
}

const Food = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalCalories: 0,
    avgCalories: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFoodEntries();
  }, [user, navigate]);

  const fetchFoodEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFoodEntries(data || []);
      
      // Calculate stats
      const totalEntries = data?.length || 0;
      const totalCalories = data?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;
      const avgCalories = totalEntries > 0 ? Math.round(totalCalories / totalEntries) : 0;
      
      setStats({ totalEntries, totalCalories, avgCalories });
    } catch (error: any) {
      console.error('Error fetching food entries:', error);
      toast.error("Failed to load food entries");
    } finally {
      setLoading(false);
    }
  };

  const deleteFoodEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Food entry deleted successfully");
      fetchFoodEntries();
    } catch (error: any) {
      console.error('Error deleting food entry:', error);
      toast.error("Failed to delete food entry");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNutrients = (nutrients: any) => {
    if (!nutrients) return null;
    
    // Check for new comprehensive format first
    if (nutrients.meal_summary?.total_nutrition) {
      const nutrition = nutrients.meal_summary.total_nutrition;
      return (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">Protein: {nutrition.proteins || 0}g</Badge>
          <Badge variant="secondary">Carbs: {nutrition.carbohydrates || 0}g</Badge>
          <Badge variant="secondary">Fat: {nutrition.fats || 0}g</Badge>
        </div>
      );
    }
    
    // Legacy format fallback
    return (
      <div className="flex gap-2 flex-wrap">
        {nutrients.protein && (
          <Badge variant="secondary">Protein: {nutrients.protein}g</Badge>
        )}
        {nutrients.carbs && (
          <Badge variant="secondary">Carbs: {nutrients.carbs}g</Badge>
        )}
        {nutrients.fat && (
          <Badge variant="secondary">Fat: {nutrients.fat}g</Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading food entries...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Analysis</h1>
            <p className="text-gray-600">Track your nutrition and dietary intake</p>
          </div>
          <Button onClick={() => navigate("/capture")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Food Entry
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Utensils className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Food items analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
              <Flame className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Calories tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Calories</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCalories}</div>
              <p className="text-xs text-muted-foreground">Per food entry</p>
            </CardContent>
          </Card>
        </div>

        {/* Food Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Food Entries</CardTitle>
            <CardDescription>Your analyzed food items and nutritional information</CardDescription>
          </CardHeader>
          <CardContent>
            {foodEntries.length === 0 ? (
              <div className="text-center py-8">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No food entries yet</h3>
                <p className="text-gray-600 mb-4">Start tracking your nutrition by adding your first food entry</p>
                <Button onClick={() => navigate("/capture")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Food Entry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Nutrients</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foodEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt="Food"
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{entry.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {entry.calories || 0} cal
                        </Badge>
                      </TableCell>
                      <TableCell>{renderNutrients(entry.extracted_nutrients)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/food/${entry.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {entry.image_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(entry.image_url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFoodEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Food;
