import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Utensils, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { CompactFilterButton } from "@/components/food/CompactFilterButton";
import { StatsCards } from "@/components/food/StatsCards";
import { FoodTable } from "@/components/food/FoodTable";
import { FoodCard } from "@/components/food/FoodCard";
import { CompactStatsHeader } from "@/components/food/CompactStatsHeader";
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const Food = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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
        .select(`
          *,
          food_items (*)
        `)
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
          <div className="text-center">
            <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading food entries...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 nw-clinical-slide-in">
        {/* Enhanced Header */}
        <div className="nw-page-header">
          <div>
            <h1 className="nw-page-title flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <span className="nw-text-gradient">Food Analysis</span>
            </h1>
            <p className="nw-page-subtitle">Track your nutrition and dietary intake with intelligent insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-green-200 rounded-xl p-1 bg-white shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-9 px-4 ${viewMode === 'grid' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 text-gray-600'} transition-all duration-200`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-9 px-4 ${viewMode === 'table' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 text-gray-600'} transition-all duration-200`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 shadow-sm hover:shadow-md nw-transition-fast"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/capture")} 
              className="nw-button-primary flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Add Food Entry
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Display */}
        {isMobile ? (
          <CompactStatsHeader
            totalEntries={stats.totalEntries}
            totalCalories={stats.totalCalories}
            avgCalories={stats.avgCalories}
            overallVegPercentage={stats.overallVegPercentage}
            isFiltered={filteredEntries.length !== foodEntries.length}
            originalCount={foodEntries.length}
          />
        ) : (
          <StatsCards
            totalEntries={stats.totalEntries}
            totalCalories={stats.totalCalories}
            avgCalories={stats.avgCalories}
            overallVegPercentage={stats.overallVegPercentage}
            isFiltered={filteredEntries.length !== foodEntries.length}
            originalCount={foodEntries.length}
          />
        )}

        {/* Enhanced Filter Button */}
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

        {/* Enhanced Food Entries Display */}
        <Card className="nw-card-modern">
          <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-green-50/50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl text-green-700">
              <Utensils className="h-5 w-5" />
              Food History
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Your analyzed food entries with nutritional insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Utensils className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {foodEntries.length === 0 ? "No food entries yet" : "No food entries match your filters"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {foodEntries.length === 0 
                    ? "Start tracking your nutrition by adding your first food entry with smart AI analysis"
                    : "Try adjusting your filters or search terms to find what you're looking for"
                  }
                </p>
                {foodEntries.length === 0 && (
                  <Button 
                    onClick={() => navigate("/capture")}
                    className="nw-button-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Food Entry
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="space-y-4">
                    {filteredEntries.map((entry) => (
                      <FoodCard
                        key={entry.id}
                        entry={entry}
                        onView={(id) => navigate(`/food/${id}`)}
                        onDelete={deleteFoodEntry}
                        getMealTypeFromEntry={getMealTypeFromEntry}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="nw-table-modern">
                    <FoodTable
                      entries={filteredEntries}
                      onView={(id) => navigate(`/food/${id}`)}
                      onDelete={deleteFoodEntry}
                      getMealTypeFromEntry={getMealTypeFromEntry}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Food;
