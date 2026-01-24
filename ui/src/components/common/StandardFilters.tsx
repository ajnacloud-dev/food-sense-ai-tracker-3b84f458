
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search, Calendar, SortAsc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StandardFiltersProps {
  searchPlaceholder?: string;
  sortOptions?: { value: string; label: string }[];
  customFilters?: React.ReactNode;
  onSearchChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  totalCount?: number;
  filteredCount?: number;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const StandardFilters = ({
  searchPlaceholder = "Search...",
  sortOptions = [
    { value: "date-desc", label: "Date (newest)" },
    { value: "date-asc", label: "Date (oldest)" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
  ],
  customFilters,
  onSearchChange,
  onSortChange,
  totalCount,
  filteredCount,
  onClearFilters,
  hasActiveFilters = false,
}: StandardFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('date-desc');
    setShowAdvanced(false);
    onClearFilters?.();
  };

  return (
    <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Main Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-green-200/50 focus:border-green-400"
              />
            </div>
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px] border-green-200/50 focus:border-green-400">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-green-200 shadow-lg">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Toggle */}
          {customFilters && (
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                  Active
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && customFilters && (
          <div className="pt-4 border-t border-green-100">
            {customFilters}
          </div>
        )}

        {/* Results & Clear */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          {totalCount !== undefined && filteredCount !== undefined && (
            <div className="text-sm text-gray-600">
              Showing {filteredCount} of {totalCount} results
              {filteredCount !== totalCount && (
                <span className="text-green-600 ml-1">(filtered)</span>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-green-50"
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
