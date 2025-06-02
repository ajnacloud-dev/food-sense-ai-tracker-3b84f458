import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { CompactFilterButton } from "@/components/food/CompactFilterButton";
import { StatsCards } from "@/components/food/StatsCards";
import { FoodTable } from "@/components/food/FoodTable";
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";

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
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Food Analysis</h1>
            <p className="text-gray-600 text-sm sm:text-base">Track your nutrition and dietary intake</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => navigate("/capture")} className="flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Food Entry</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <StatsCards
          totalEntries={stats.totalEntries}
          totalCalories={stats.totalCalories}
          avgCalories={stats.avgCalories}
          overallVegPercentage={stats.overallVegPercentage}
          isFiltered={filteredEntries.length !== foodEntries.length}
          originalCount={foodEntries.length}
        />

        {/* Filter Button positioned above the table */}
        <div className="flex justify-end">
          <CompactFilterButton
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
        </div>

        {/* Food Entries Table */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No food entries found</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
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
          <FoodTable
            entries={filteredEntries}
            onView={(id) => navigate(`/food/${id}`)}
            onDelete={deleteFoodEntry}
            getMealTypeFromEntry={getMealTypeFromEntry}
          />
        )}
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Food;
