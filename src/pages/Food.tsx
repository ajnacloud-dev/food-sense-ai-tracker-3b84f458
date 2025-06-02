import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Utensils, Calendar, Flame, Plus, Eye, Trash2, RefreshCw, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { MealTypeFilter } from "@/components/food/MealTypeFilter";
import { ComprehensiveFilterBar } from "@/components/food/ComprehensiveFilterBar";
import { calculateVegetarianPercentage, getVegetarianBadgeColor } from "@/utils/vegetarianUtils";

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
}

const Food = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDietType, setSelectedDietType] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Extract meal type from JSON data or database field
  const getMealTypeFromEntry = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  };

  // Filter entries based on all selected filters
  const filteredEntries = useMemo(() => {
    let filtered = foodEntries;

    // Filter by meal type
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(entry => {
        const mealType = getMealTypeFromEntry(entry).toLowerCase();
        return mealType === selectedMealType.toLowerCase();
      });
    }

    // Filter by diet type
    if (selectedDietType !== 'all') {
      filtered = filtered.filter(entry => {
        const vegData = calculateVegetarianPercentage(entry);
        switch (selectedDietType) {
          case 'vegetarian':
            return vegData.isVegetarian;
          case 'vegan':
            return vegData.isVegan;
          case 'non-vegetarian':
            return !vegData.isVegetarian;
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        
        if (startDate && endDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return entryDateOnly >= start && entryDateOnly <= end;
        } else if (startDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          return entryDateOnly >= start;
        } else if (endDate) {
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return entryDateOnly <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [foodEntries, selectedMealType, selectedDietType, startDate, endDate]);

  // Calculate meal type counts for filter badges
  const mealTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    foodEntries.forEach(entry => {
      const mealType = getMealTypeFromEntry(entry).toLowerCase();
      counts[mealType] = (counts[mealType] || 0) + 1;
    });
    return counts;
  }, [foodEntries]);

  // Calculate diet type counts for filter badges
  const dietTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: foodEntries.length };
    foodEntries.forEach(entry => {
      const vegData = calculateVegetarianPercentage(entry);
      if (vegData.isVegan) {
        counts.vegan = (counts.vegan || 0) + 1;
        counts.vegetarian = (counts.vegetarian || 0) + 1;
      } else if (vegData.isVegetarian) {
        counts.vegetarian = (counts.vegetarian || 0) + 1;
      } else {
        counts['non-vegetarian'] = (counts['non-vegetarian'] || 0) + 1;
      }
    });
    return counts;
  }, [foodEntries]);

  // Calculate stats based on filtered entries
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalCalories = filteredEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    const avgCalories = totalEntries > 0 ? Math.round(totalCalories / totalEntries) : 0;
    
    // Calculate vegetarian percentage across filtered entries
    let totalVegCalories = 0;
    let totalFilteredCalories = 0;
    filteredEntries.forEach(entry => {
      const vegData = calculateVegetarianPercentage(entry);
      const entryCalories = entry.calories || 0;
      totalFilteredCalories += entryCalories;
      totalVegCalories += (entryCalories * vegData.percentage) / 100;
    });
    
    const overallVegPercentage = totalFilteredCalories > 0 
      ? Math.round((totalVegCalories / totalFilteredCalories) * 100)
      : 0;
    
    return { totalEntries, totalCalories, avgCalories, overallVegPercentage };
  }, [filteredEntries]);

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
      console.log('Fetching food entries for user:', user.id);
      
      const { data: foodData, error: foodError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (foodError) throw foodError;

      console.log('Found food entries:', foodData?.length || 0);
      setFoodEntries(foodData || []);
    } catch (error: any) {
      console.error('Error fetching food entries:', error);
      toast.error("Failed to load food entries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFoodEntries();
    toast.success("Food entries refreshed");
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

  const handleRowClick = (entryId: string, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/food/${entryId}`);
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

  const renderNutrients = (entry: FoodEntry) => {
    const vegData = calculateVegetarianPercentage(entry);
    
    return (
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-500" />
          {entry.calories || 0} cal
        </Badge>
        {vegData.percentage > 0 && (
          <Badge className={`${getVegetarianBadgeColor(vegData.percentage)} border text-xs`}>
            {vegData.percentage}% Veg
          </Badge>
        )}
        {entry.total_protein > 0 && (
          <Badge variant="secondary">P: {entry.total_protein}g</Badge>
        )}
        {entry.total_carbohydrates > 0 && (
          <Badge variant="secondary">C: {entry.total_carbohydrates}g</Badge>
        )}
        {entry.total_fats > 0 && (
          <Badge variant="secondary">F: {entry.total_fats}g</Badge>
        )}
      </div>
    );
  };

  const renderMealType = (entry: FoodEntry) => {
    const mealType = getMealTypeFromEntry(entry);
    if (!mealType || mealType === 'unknown') return null;
    
    return (
      <Badge variant="outline" className="capitalize">
        {mealType}
      </Badge>
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/capture")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Food Entry
            </Button>
          </div>
        </div>

        {/* Comprehensive Filter Bar */}
        <ComprehensiveFilterBar
          selectedMealType={selectedMealType}
          onMealTypeChange={setSelectedMealType}
          mealTypeCounts={mealTypeCounts}
          selectedDietType={selectedDietType}
          onDietTypeChange={setSelectedDietType}
          dietTypeCounts={dietTypeCounts}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Utensils className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                {filteredEntries.length !== foodEntries.length ? 
                  `Filtered from ${foodEntries.length} total` : 
                  'Food items analyzed'
                }
              </p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vegetarian %</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallVegPercentage}%</div>
              <p className="text-xs text-muted-foreground">Plant-based calories</p>
            </CardContent>
          </Card>
        </div>

        {/* Food Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Food Entries</CardTitle>
            <CardDescription>
              {filteredEntries.length !== foodEntries.length ? 
                `Showing ${filteredEntries.length} of ${foodEntries.length} entries` :
                'Your analyzed food items and nutritional information'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No food entries found</h3>
                <p className="text-gray-600 mb-4">
                  {foodEntries.length === 0 ? 
                    'Start tracking your nutrition by adding your first food entry' :
                    'Try adjusting your filters or add more food entries'
                  }
                </p>
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
                    <TableHead>Meal Type</TableHead>
                    <TableHead>Nutrition Info</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow 
                      key={entry.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={(e) => handleRowClick(entry.id, e)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt="Food"
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="font-medium">{entry.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderMealType(entry)}
                      </TableCell>
                      <TableCell>
                        {renderNutrients(entry)}
                      </TableCell>
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
