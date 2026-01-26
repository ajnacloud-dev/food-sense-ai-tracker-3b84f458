
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Filter, Search, SortAsc, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SortOption {
  value: string;
  label: string;
}

interface ModernFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  
  // Advanced filters
  advancedFilters?: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  
  // Results info
  totalCount?: number;
  filteredCount?: number;
  
  // Styling
  className?: string;
}

export const ModernFilterBar = ({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  advancedFilters,
  hasActiveFilters = false,
  onClearFilters,
  totalCount,
  filteredCount,
  className = "",
}: ModernFilterBarProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleClearAll = () => {
    onSearchChange?.("");
    onSortChange?.(sortOptions[0]?.value || "");
    onClearFilters?.();
    setIsAdvancedOpen(false);
  };

  return (
    <Card className={`border-green-200/50 shadow-lg bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm ${className}`}>
      <CardContent className="p-6 space-y-4">
        {/* Main Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 border-green-200/60 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm h-11"
              />
            </div>
          </div>

          {/* Sort */}
          {sortOptions.length > 0 && (
            <Select value={sortValue} onValueChange={onSortChange}>
              <SelectTrigger className="w-full sm:w-[200px] border-green-200/60 focus:border-green-400 bg-white/80 backdrop-blur-sm h-11">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-green-600" />
                  <SelectValue placeholder="Sort by..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-green-200 shadow-xl rounded-lg">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-green-50">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Advanced Filters Toggle */}
          {advancedFilters && (
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-green-200/60 hover:bg-green-50 hover:border-green-300 bg-white/80 backdrop-blur-sm h-11 px-4"
                >
                  <Filter className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 text-green-600 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4">
                <div className="p-4 bg-gradient-to-r from-green-50/50 to-white rounded-lg border border-green-100/60">
                  {advancedFilters}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Results & Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-green-100/50">
          {/* Results Count */}
          {totalCount !== undefined && filteredCount !== undefined && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Showing <span className="font-semibold text-green-700">{filteredCount}</span> of{" "}
                <span className="font-semibold">{totalCount}</span> results
                {filteredCount !== totalCount && (
                  <span className="text-green-600 ml-1">(filtered)</span>
                )}
              </span>
            </div>
          )}

          {/* Clear Actions */}
          {(hasActiveFilters || searchValue || isAdvancedOpen) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-green-50 transition-all"
            >
              <X className="h-3 w-3" />
              <span className="font-medium">Clear all</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
