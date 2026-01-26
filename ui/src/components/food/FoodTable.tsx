
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar, Utensils } from "lucide-react";
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface FoodTableProps {
  participantId?: string;
  entries?: FoodEntry[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  getMealTypeFromEntry?: (entry: FoodEntry) => string;
}

export const FoodTable = ({ 
  participantId, 
  entries: propEntries,
  onView,
  onDelete,
  getMealTypeFromEntry 
}: FoodTableProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(propEntries || []);
  const [loading, setLoading] = useState(!propEntries);
  const [filters, setFilters] = useState<{
    date: DateRange | undefined;
    searchTerm: string;
  }>({
    date: undefined,
    searchTerm: '',
  });

  const fetchFoodEntries = async () => {
    if (!participantId || propEntries) {
      console.log('FoodTable: No participantId provided or entries already provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('FoodTable: Fetching entries for participant:', participantId);
      
      let query = backendApi
        .from('food_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('user_id', participantId)
        .order('created_at', { ascending: false });

      if (filters.date?.from) {
        const from = format(filters.date.from, 'yyyy-MM-dd');
        query = query.gte('created_at', from);
      }
  
      if (filters.date?.to) {
        const to = format(filters.date.to, 'yyyy-MM-dd');
        query = query.lte('created_at', to);
      }
  
      if (filters.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('FoodTable: Error fetching food entries:', error);
        throw error;
      }

      console.log('FoodTable: Fetched entries:', data?.length || 0);
      setFoodEntries(data || []);
    } catch (error) {
      console.error('FoodTable: Error:', error);
      toast.error('Failed to fetch food entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propEntries) {
      fetchFoodEntries();
    }
  }, [participantId, filters, propEntries]);

  useEffect(() => {
    if (propEntries) {
      setFoodEntries(propEntries);
      setLoading(false);
    }
  }, [propEntries]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

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

  const handleView = (id: string) => {
    if (onView) {
      onView(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      // Refresh entries if we're fetching our own data
      if (!propEntries) {
        fetchFoodEntries();
      }
    }
  };

  const getMealType = (entry: FoodEntry) => {
    if (getMealTypeFromEntry) {
      return getMealTypeFromEntry(entry);
    }
    return entry.meal_type || 'Unknown';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading food entries...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Entries</CardTitle>
        <CardDescription>
          Track daily food intake and nutrition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!propEntries && (
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="search">Search:</Label>
              <Input
                id="search"
                placeholder="Search descriptions..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label>Date Range:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !filters.date?.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.date?.from ? (
                      filters.date.to ? (
                        `${format(filters.date.from, "MMM dd, yyyy")} - ${format(filters.date.to, "MMM dd, yyyy")}`
                      ) : (
                        format(filters.date.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={filters.date?.from}
                    selected={filters.date}
                    onSelect={(date) => handleFilterChange({ ...filters, date })}
                    disabled={{
                      before: new Date('2020-01-01'),
                      after: new Date(),
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        <ScrollArea className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Meal Type</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Protein</TableHead>
                <TableHead>Carbs</TableHead>
                <TableHead>Fat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodEntries.map((entry) => {
                const { totalCalories, totalProtein, totalCarbs, totalFat } = calculateTotals(entry);

                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        {entry.image_url && (
                          <AvatarImage src={entry.image_url} alt="Food" className="object-cover" />
                        )}
                        <AvatarFallback className="bg-orange-100">
                          <Utensils className="h-4 w-4 text-orange-600" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{format(new Date(entry.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{entry.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMealType(entry)}</Badge>
                    </TableCell>
                    <TableCell>{totalCalories.toFixed(0)}</TableCell>
                    <TableCell>{totalProtein.toFixed(0)}g</TableCell>
                    <TableCell>{totalCarbs.toFixed(0)}g</TableCell>
                    <TableCell>{totalFat.toFixed(0)}g</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(entry.id)}
                        >
                          View Details
                        </Button>
                        {onDelete && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {foodEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No food entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FoodTable;
