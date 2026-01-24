import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Utensils, Grid2X2, List, RefreshCw } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { useFoodEntries } from "@/hooks/useFoodEntries";
import { ModernFoodGrid } from "@/components/food/ModernFoodGrid";
import { FoodTable } from "@/components/food/FoodTable";
import { ModernFilterBar } from "@/components/common/ModernFilterBar";
import { FoodAdvancedFilters } from "@/components/food/FoodAdvancedFilters";
import { CompactStatsGrid } from "@/components/food/CompactStatsGrid";
import CaretakerFoodPermissionGuard from "./CaretakerFoodPermissionGuard";
import { calculateVegetarianPercentage } from "@/utils/vegetarianUtils";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

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

const EnhancedCaretakerFoodView = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading: contextLoading } = useCaretakerData();
  const { hasPermission, missingPermissions, loading: permissionLoading } = usePermissionStatus(selectedParticipantId);
  
  const { foodEntries, loading, refreshing, handleRefresh } = useFoodEntries({
    selectedParticipantId,
    hasPermission: useCallback((category: string) => hasPermission(category), [hasPermission]),
    permissionLoading
  });

  // View and filter states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('created_at-desc');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDietType, setSelectedDietType] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const getMealTypeFromEntry = useCallback((entry: FoodEntry) => {
    return entry.extracted_nutrients?.meal_summary?.meal_type || 
           entry.extracted_nutrients?.meal_type || 
           entry.meal_type || 
           'unknown';
  }, []);

  // Filter and sort logic
  const { filteredEntries, mealTypeCounts, dietTypeCounts, totalStats, overallVegPercentage } = useMemo(() => {
    let filtered = [...foodEntries];

    // Search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.description?.toLowerCase().includes(search) ||
        getMealTypeFromEntry(entry).toLowerCase().includes(search)
      );
    }

    // Meal type filter
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(entry => 
        getMealTypeFromEntry(entry).toLowerCase() === selectedMealType.toLowerCase()
      );
    }

    // Date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.created_at);
        
        if (startDate && endDate) {
          return isWithinInterval(entryDate, {
            start: startOfDay(startDate),
            end: endOfDay(endDate)
          });
        } else if (startDate) {
          return entryDate >= startOfDay(startDate);
        } else if (endDate) {
          return entryDate <= endOfDay(endDate);
        }
        
        return true;
      });
    }

    // Diet type filter
    if (selectedDietType !== 'all') {
      filtered = filtered.filter(entry => {
        const vegData = calculateVegetarianPercentage(entry);
        switch (selectedDietType) {
          case 'vegetarian':
            return vegData.isVegetarian && !vegData.isVegan;
          case 'vegan':
            return vegData.isVegan;
          case 'non-vegetarian':
            return !vegData.isVegetarian;
          case 'mixed':
            return vegData.percentage > 0 && vegData.percentage < 100;
          default:
            return true;
        }
      });
    }

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_at-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'calories-desc':
          return (b.calories || 0) - (a.calories || 0);
        case 'calories-asc':
          return (a.calories || 0) - (b.calories || 0);
        case 'meal-type':
          return getMealTypeFromEntry(a).localeCompare(getMealTypeFromEntry(b));
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Calculate counts
    const mealCounts: Record<string, number> = { all: foodEntries.length };
    const dietCounts: Record<string, number> = { all: foodEntries.length };

    foodEntries.forEach(entry => {
      const mealType = getMealTypeFromEntry(entry).toLowerCase();
      mealCounts[mealType] = (mealCounts[mealType] || 0) + 1;

      const vegData = calculateVegetarianPercentage(entry);
      if (vegData.isVegan) {
        dietCounts.vegan = (dietCounts.vegan || 0) + 1;
      } else if (vegData.isVegetarian) {
        dietCounts.vegetarian = (dietCounts.vegetarian || 0) + 1;
      } else if (vegData.percentage > 0 && vegData.percentage < 100) {
        dietCounts.mixed = (dietCounts.mixed || 0) + 1;
      } else {
        dietCounts['non-vegetarian'] = (dietCounts['non-vegetarian'] || 0) + 1;
      }
    });

    // Calculate total stats and vegetarian percentage
    const stats = foodEntries.reduce((acc, entry) => {
      acc.totalCalories += entry.calories || 0;
      acc.totalProtein += entry.total_protein || 0;
      acc.totalCarbs += entry.total_carbohydrates || 0;
      acc.totalFat += entry.total_fats || 0;
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    // Calculate overall vegetarian percentage
    const vegEntries = foodEntries.filter(entry => {
      const vegData = calculateVegetarianPercentage(entry);
      return vegData.isVegetarian;
    });
    const vegPercentage = foodEntries.length > 0 ? Math.round((vegEntries.length / foodEntries.length) * 100) : 0;

    return {
      filteredEntries: filtered,
      mealTypeCounts: mealCounts,
      dietTypeCounts: dietCounts,
      totalStats: stats,
      overallVegPercentage: vegPercentage
    };
  }, [foodEntries, searchValue, selectedMealType, selectedDietType, startDate, endDate, sortBy, getMealTypeFromEntry]);

  const handleViewEntry = useCallback((id: string) => {
    navigate(`/caretaker/food/${id}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/caretaker');
  }, [navigate]);

  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    setSelectedMealType('all');
    setSelectedDietType('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setSortBy('created_at-desc');
  }, []);

  // Fix the boolean conversion for hasActiveFilters
  const hasActiveFilters = selectedMealType !== 'all' || 
                          selectedDietType !== 'all' || 
                          Boolean(startDate) || 
                          Boolean(endDate) || 
                          Boolean(searchValue.trim());

  const sortOptions = [
    { value: 'created_at-desc', label: 'Newest First' },
    { value: 'created_at-asc', label: 'Oldest First' },
    { value: 'calories-desc', label: 'Highest Calories' },
    { value: 'calories-asc', label: 'Lowest Calories' },
    { value: 'meal-type', label: 'Meal Type' },
  ];

  // Calculate average calories
  const avgCalories = foodEntries.length > 0 ? Math.round(totalStats.totalCalories / foodEntries.length) : 0;

  if (contextLoading || permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading patient nutrition data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container mx-auto p-6">
          <Card className="max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <User className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-3xl text-gray-900">No Patient Selected</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Please select a patient from the sidebar to view their nutrition entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleBack} 
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-lg px-8 py-3"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Modern Header */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Nutrition Monitoring</h1>
                  <p className="text-green-100 text-lg">Patient: {participantData.full_name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {hasPermission('food_entries') && (
                  <Button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
                <Button 
                  onClick={handleBack}
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasPermission('food_entries') ? (
          <CaretakerFoodPermissionGuard participantName={participantData.full_name} />
        ) : (
          <>
            {/* Stats Overview */}
            <CompactStatsGrid 
              totalEntries={foodEntries.length}
              totalCalories={totalStats.totalCalories}
              avgCalories={avgCalories}
              overallVegPercentage={overallVegPercentage}
              isFiltered={hasActiveFilters}
              originalCount={foodEntries.length}
            />

            {/* Filter Bar */}
            <ModernFilterBar
              searchPlaceholder="Search food entries..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
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

            {/* View Toggle and Content */}
            <Card className="border-green-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900">Food Entries</CardTitle>
                    <CardDescription>
                      {filteredEntries.length} of {foodEntries.length} entries
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Utensils className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Food Entries Found</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {hasActiveFilters 
                        ? "No entries match your current filters. Try adjusting your search criteria."
                        : `${participantData.full_name} hasn't logged any food entries yet.`
                      }
                    </p>
                    {hasActiveFilters && (
                      <Button 
                        onClick={handleClearFilters}
                        variant="outline"
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  <ModernFoodGrid 
                    entries={filteredEntries}
                    onView={handleViewEntry}
                    getMealTypeFromEntry={getMealTypeFromEntry}
                  />
                ) : (
                  <FoodTable 
                    entries={filteredEntries}
                    onView={handleViewEntry}
                    getMealTypeFromEntry={getMealTypeFromEntry}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedCaretakerFoodView;
