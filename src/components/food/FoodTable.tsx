
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "lucide-react";
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client";
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
}

export const FoodTable = ({ participantId }: FoodTableProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    date: DateRange | undefined;
    searchTerm: string;
  }>({
    date: undefined,
    searchTerm: '',
  });

  const fetchFoodEntries = async () => {
    if (!participantId) {
      console.log('FoodTable: No participantId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('FoodTable: Fetching entries for participant:', participantId);
      
      let query = supabase
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
    fetchFoodEntries();
  }, [participantId, filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const calculateTotals = (entry: FoodEntry) => {
    let totalCalories = entry.calories || 0;
    let totalProtein = entry.total_protein || 0;
    let totalCarbs = entry.total_carbohydrates || 0;
    let totalFat = entry.total_fats || 0;
  
    // If no totals in entry, calculate from food items
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
        <ScrollArea className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Food Items</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Protein</TableHead>
                <TableHead>Carbs</TableHead>
                <TableHead>Fat</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodEntries.map((entry) => {
                const { totalCalories, totalProtein, totalCarbs, totalFat } = calculateTotals(entry);

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{format(new Date(entry.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {entry.food_items?.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {entry.food_items.map((item) => (
                            <li key={item.id}>
                              {item.quantity || 1} {item.serving_size || 'serving'}(s) of {item.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No items</span>
                      )}
                    </TableCell>
                    <TableCell>{totalCalories.toFixed(0)}</TableCell>
                    <TableCell>{totalProtein.toFixed(0)}g</TableCell>
                    <TableCell>{totalCarbs.toFixed(0)}g</TableCell>
                    <TableCell>{totalFat.toFixed(0)}g</TableCell>
                    <TableCell>{entry.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/food/${entry.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {foodEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
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
