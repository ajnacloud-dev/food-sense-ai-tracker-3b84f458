import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Utensils, LayoutGrid, List } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { FoodTable } from "@/components/food/FoodTable";
import { ModernFoodGrid } from "@/components/food/ModernFoodGrid";
import { CompactStatsGrid } from "@/components/food/CompactStatsGrid";
import { FoodAdvancedFilters } from "@/components/food/FoodAdvancedFilters";
import { ModernFilterBar } from "@/components/common/ModernFilterBar";
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
// import { useAnalysisQueue } from "@/hooks/useAnalysisQueue"; // Removed - moved away from queue system
// import { Badge } from "@/components/ui/badge"; // Removed with queue system
// import { Progress } from "@/components/ui/progress"; // Removed with queue system

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

  // Queue system removed - we moved away from queue-based processing
  // const { jobs, fetchJobs } = useAnalysisQueue();

  // Filter states - Default to last 3 days
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDietType, setSelectedDietType] = useState('all');
  // Default to 3 days ago for start date
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  // Default to today for end date
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });

  const getMealTypeFromEntry = (entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type ||
      entry.extracted_nutrients?.meal_type ||
      entry.meal_type ||
      'unknown';
  };

  const sortOptions = [
    { value: 'date-desc', label: 'Date (newest first)' },
    { value: 'date-asc', label: 'Date (oldest first)' },
    { value: 'calories-desc', label: 'Calories (high to low)' },
    { value: 'calories-asc', label: 'Calories (low to high)' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  const filteredEntries = useMemo(() => {
    let filtered = foodEntries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMealTypeFromEntry(entry).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Meal type filter
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(entry => {
        const mealType = getMealTypeFromEntry(entry).toLowerCase();
        return mealType === selectedMealType.toLowerCase();
      });
    }

    // Diet type filter
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

    // Date range filter
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

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'calories-desc':
          return (b.calories || 0) - (a.calories || 0);
        case 'calories-asc':
          return (a.calories || 0) - (b.calories || 0);
        case 'name-asc':
          return (a.description || '').localeCompare(b.description || '');
        case 'name-desc':
          return (b.description || '').localeCompare(a.description || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [foodEntries, searchTerm, sortBy, selectedMealType, selectedDietType, startDate, endDate]);

  const mealTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: foodEntries.length };
    foodEntries.forEach(entry => {
      const mealType = getMealTypeFromEntry(entry).toLowerCase();
      counts[mealType] = (counts[mealType] || 0) + 1;
    });
    return counts;
  }, [foodEntries]);

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

  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalCalories = filteredEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    const avgCalories = totalEntries > 0 ? Math.round(totalCalories / totalEntries) : 0;

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

  const hasActiveFilters = selectedMealType !== 'all' || selectedDietType !== 'all' || !!startDate || !!endDate;

  const handleClearFilters = () => {
    setSelectedMealType('all');
    setSelectedDietType('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFoodEntries();
    // Removed fetchJobs() - we moved away from queue system
  }, [user, navigate]);

  // Removed periodic job refresh - no longer using queue system

  const fetchFoodEntries = async () => {
    if (!user) return;

    try {
      console.log('Fetching food entries for user:', user.id);

      // Fetch only current user's entries - NO food_items needed!
      const { data: entriesData } = await api.from('food_entries')
        .select()
        .eq('user_id', user.id)
        .limit(100);  // Increased limit but still reasonable for performance

      if (!entriesData) throw new Error("Failed to fetch entries");

      // Process entries (removed food_items join - not used in UI)
      const userEntries = entriesData
        .map((entry: any) => {
          // Parse JSON strings if they exist
          if (entry.extracted_nutrients && typeof entry.extracted_nutrients === 'string') {
            try {
              entry.extracted_nutrients = JSON.parse(entry.extracted_nutrients);
            } catch (e) {
              console.error('Failed to parse extracted_nutrients:', e);
            }
          }
          if (entry.ingredients && typeof entry.ingredients === 'string') {
            try {
              entry.ingredients = JSON.parse(entry.ingredients);
            } catch (e) {
              console.error('Failed to parse ingredients:', e);
            }
          }

          return {
            ...entry,
            food_items: []  // Empty array - not using food_items in display
          };
        });

      // Sort desc
      userEntries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Found food entries:', userEntries.length);
      setFoodEntries(userEntries);
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
      const { error } = await api.from('food_entries').delete().eq('id', id);

      // Note: Generic API Delete is mocked in api.ts for now or needs implementation.
      // If it fails silently, we assume success in UI but backend needs real delete.
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
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Food Analysis</h1>
              <p className="text-sm text-gray-600">Track your nutrition and dietary intake</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-50'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-8 px-3 ${viewMode === 'table' ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {!isMobile && "Refresh"}
            </Button>
            <Button
              onClick={() => navigate("/capture")}
              size="sm"
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {!isMobile && "Add Food"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <CompactStatsGrid
          totalEntries={stats.totalEntries}
          totalCalories={stats.totalCalories}
          avgCalories={stats.avgCalories}
          overallVegPercentage={stats.overallVegPercentage}
          isFiltered={filteredEntries.length !== foodEntries.length}
          originalCount={foodEntries.length}
        />

        {/* Queue Status Section removed - we moved away from queue system */}

        {/* Modern Filter Bar */}
        <ModernFilterBar
          searchPlaceholder="Search food entries..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          advancedFilters={
            <FoodAdvancedFilters
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
          }
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          totalCount={foodEntries.length}
          filteredCount={filteredEntries.length}
        />

        {/* Food Entries Display */}
        {filteredEntries.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {foodEntries.length === 0 ? "No food entries yet" : "No entries match your filters"}
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {foodEntries.length === 0
                  ? "Start tracking your nutrition by adding your first food entry with smart AI analysis"
                  : "Try adjusting your filters to find what you're looking for"
                }
              </p>
              {foodEntries.length === 0 && (
                <Button
                  onClick={() => navigate("/capture")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Food Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <ModernFoodGrid
                entries={filteredEntries}
                onView={(id) => navigate(`/food/${id}`)}
                onDelete={deleteFoodEntry}
                getMealTypeFromEntry={getMealTypeFromEntry}
              />
            ) : (
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <FoodTable
                    entries={filteredEntries}
                    onView={(id) => navigate(`/food/${id}`)}
                    onDelete={deleteFoodEntry}
                    getMealTypeFromEntry={getMealTypeFromEntry}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Food;
