
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Flame, Calendar, ArrowUpDown } from "lucide-react";
import { calculateVegetarianPercentage, getVegetarianBadgeColor } from "@/utils/vegetarianUtils";
import { useState } from "react";

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

interface FoodTableProps {
  entries: FoodEntry[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  getMealTypeFromEntry: (entry: FoodEntry) => string;
}

type SortField = 'description' | 'calories' | 'created_at' | 'meal_type';
type SortDirection = 'asc' | 'desc';

export const FoodTable = ({ entries, onView, onDelete, getMealTypeFromEntry }: FoodTableProps) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayType = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
  };

  const renderDietaryType = (entry: FoodEntry) => {
    const vegData = calculateVegetarianPercentage(entry);
    
    if (vegData.isVegan) {
      return <Badge className="bg-green-600 text-white text-xs">Vegan</Badge>;
    } else if (vegData.isVegetarian) {
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Vegetarian</Badge>;
    } else if (vegData.percentage > 0) {
      return <Badge className={`${getVegetarianBadgeColor(vegData.percentage)} text-xs`}>{vegData.percentage}% Veg</Badge>;
    } else {
      return <Badge variant="outline" className="text-red-600 text-xs">Non-Veg</Badge>;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'meal_type') {
      aValue = getMealTypeFromEntry(a);
      bValue = getMealTypeFromEntry(b);
    }

    if (sortField === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-2 hover:text-gray-900">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <SortableHeader field="description">Food Description</SortableHeader>
            <SortableHeader field="meal_type">Meal Type</SortableHeader>
            <TableHead>Dietary Type</TableHead>
            <TableHead>Day Type</TableHead>
            <SortableHeader field="calories">Nutrition</SortableHeader>
            <SortableHeader field="created_at">Date</SortableHeader>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry, index) => {
            const mealType = getMealTypeFromEntry(entry);
            const dayType = getDayType(entry.created_at);
            
            return (
              <TableRow key={entry.id} className={`hover:bg-gray-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {entry.image_url && (
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={entry.image_url}
                          alt="Food"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  {mealType && mealType !== 'unknown' ? (
                    <Badge variant="outline" className="text-xs capitalize">
                      {mealType}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">Unknown</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {renderDietaryType(entry)}
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${dayType === 'weekend' 
                      ? "bg-purple-50 text-purple-700 border-purple-200" 
                      : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {dayType === 'weekend' ? 'Weekend' : 'Weekday'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span className="font-medium">{entry.calories || 0}</span>
                      <span className="text-gray-500 text-xs">cal</span>
                    </div>
                    {(entry.total_protein > 0 || entry.total_carbohydrates > 0 || entry.total_fats > 0) && (
                      <div className="text-xs text-gray-600 space-x-2">
                        {entry.total_protein > 0 && <span>P:{entry.total_protein}g</span>}
                        {entry.total_carbohydrates > 0 && <span>C:{entry.total_carbohydrates}g</span>}
                        {entry.total_fats > 0 && <span>F:{entry.total_fats}g</span>}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(entry.created_at)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(entry.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(entry.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {sortedEntries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No food entries found matching your filters.</p>
        </div>
      )}
    </div>
  );
};
