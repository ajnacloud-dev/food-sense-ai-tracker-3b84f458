
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, Search, Filter, TrendingUp, Utensils, Clock } from "lucide-react";
import { format } from 'date-fns';

interface FoodEntry {
  id: string;
  created_at: string;
  description?: string;
  user_id: string;
  meal_type?: string;
  total_protein?: number;
  total_carbohydrates?: number;
  total_fats?: number;
  calories?: number;
  image_url?: string;
  extracted_nutrients?: any;
  food_items: FoodItem[];
}

interface FoodItem {
  id: string;
  name: string;
  calories?: number;
  proteins?: number;
  carbohydrates?: number;
  fats?: number;
  serving_size?: string;
  quantity?: number;
}

interface ModernFoodTableProps {
  entries: FoodEntry[];
  onView: (id: string) => void;
  getMealTypeFromEntry?: (entry: FoodEntry) => string;
  participantName?: string;
}

const ModernFoodTable = ({ 
  entries,
  onView,
  getMealTypeFromEntry,
  participantName 
}: ModernFoodTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState(entries);

  useEffect(() => {
    const filtered = entries.filter(entry => 
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getMealTypeFromEntry?.(entry)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [entries, searchTerm, getMealTypeFromEntry]);

  const calculateTotals = (entry: FoodEntry) => {
    // First try to get nutrition from extracted_nutrients
    const extractedNutrition = entry.extracted_nutrients?.meal_summary?.total_nutrition;
    
    if (extractedNutrition) {
      return {
        totalCalories: extractedNutrition.calories || 0,
        totalProtein: extractedNutrition.proteins || 0,
        totalCarbs: extractedNutrition.carbohydrates || 0,
        totalFat: extractedNutrition.fats || 0,
      };
    }

    // Fallback to direct columns
    let totalCalories = entry.calories || 0;
    let totalProtein = entry.total_protein || 0;
    let totalCarbs = entry.total_carbohydrates || 0;
    let totalFat = entry.total_fats || 0;

    // If still no data, calculate from food items
    if (!totalCalories && entry.food_items?.length > 0) {
      entry.food_items.forEach(item => {
        const quantity = item.quantity || 1;
        totalCalories += (item.calories || 0) * quantity;
        totalProtein += (item.proteins || 0) * quantity;
        totalCarbs += (item.carbohydrates || 0) * quantity;
        totalFat += (item.fats || 0) * quantity;
      });
    }

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lunch': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dinner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'snack': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTodaysEntries = () => {
    const today = new Date().toDateString();
    return filteredEntries.filter(entry => 
      new Date(entry.created_at).toDateString() === today
    ).length;
  };

  const getTotalCaloriesToday = () => {
    const today = new Date().toDateString();
    return filteredEntries
      .filter(entry => new Date(entry.created_at).toDateString() === today)
      .reduce((total, entry) => total + calculateTotals(entry).totalCalories, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Today's Entries</p>
                <p className="text-2xl font-bold">{getTodaysEntries()}</p>
              </div>
              <Utensils className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Calories</p>
                <p className="text-2xl font-bold">{Math.round(getTotalCaloriesToday())}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Entries</p>
                <p className="text-2xl font-bold">{filteredEntries.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-600" />
            Food Entries {participantName && `- ${participantName}`}
          </CardTitle>
          <CardDescription>Monitor nutrition intake and meal patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search food entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Food Entries Grid */}
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No food entries found</h3>
                <p className="text-gray-500">No food entries match your search criteria.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const { totalCalories, totalProtein, totalCarbs, totalFat } = calculateTotals(entry);
                const mealType = getMealTypeFromEntry?.(entry) || entry.meal_type || 'Unknown';

                return (
                  <Card 
                    key={entry.id} 
                    className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-orange-500"
                    onClick={() => onView(entry.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 rounded-lg">
                            {entry.image_url && (
                              <AvatarImage src={entry.image_url} alt="Food" className="object-cover" />
                            )}
                            <AvatarFallback className="rounded-lg bg-orange-100">
                              <Utensils className="h-6 w-6 text-orange-600" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={`${getMealTypeColor(mealType)} border`}>
                                {mealType}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                {format(new Date(entry.created_at), 'MMM dd, yyyy - h:mm a')}
                              </div>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {entry.description || 'No description available'}
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-orange-600">{Math.round(totalCalories)}</div>
                                <div className="text-xs text-gray-500">Calories</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{Math.round(totalProtein)}g</div>
                                <div className="text-xs text-gray-500">Protein</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{Math.round(totalCarbs)}g</div>
                                <div className="text-xs text-gray-500">Carbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{Math.round(totalFat)}g</div>
                                <div className="text-xs text-gray-500">Fat</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" className="ml-4">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernFoodTable;
