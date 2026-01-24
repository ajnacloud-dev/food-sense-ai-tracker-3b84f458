
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search, DollarSign, Calendar, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiptFiltersProps {
  onFiltersChange: (filters: ReceiptFilterState) => void;
  vendors: string[];
  totalCount: number;
  filteredCount: number;
}

export interface ReceiptFilterState {
  searchTerm: string;
  vendor: string;
  minAmount: string;
  maxAmount: string;
  dateRange: string;
  sortBy: string;
}

export const ReceiptFilters = ({ onFiltersChange, vendors, totalCount, filteredCount }: ReceiptFiltersProps) => {
  const [filters, setFilters] = useState<ReceiptFilterState>({
    searchTerm: '',
    vendor: '',
    minAmount: '',
    maxAmount: '',
    dateRange: '',
    sortBy: 'date-desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<ReceiptFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ReceiptFilterState = {
      searchTerm: '',
      vendor: '',
      minAmount: '',
      maxAmount: '',
      dateRange: '',
      sortBy: 'date-desc'
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'date-desc');

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Main Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors, items..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (newest)</SelectItem>
              <SelectItem value="date-asc">Date (oldest)</SelectItem>
              <SelectItem value="amount-desc">Amount (highest)</SelectItem>
              <SelectItem value="amount-asc">Amount (lowest)</SelectItem>
              <SelectItem value="vendor-asc">Vendor (A-Z)</SelectItem>
              <SelectItem value="vendor-desc">Vendor (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(filters).filter(v => v !== '' && v !== 'date-desc').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Vendor Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Vendor
              </label>
              <Select value={filters.vendor} onValueChange={(value) => updateFilters({ vendor: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Min Amount
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => updateFilters({ minAmount: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max Amount
              </label>
              <Input
                type="number"
                placeholder="1000.00"
                value={filters.maxAmount}
                onChange={(e) => updateFilters({ maxAmount: e.target.value })}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilters({ dateRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters & Results */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-gray-600">
            Showing {filteredCount} of {totalCount} receipts
            {filteredCount !== totalCount && (
              <span className="text-blue-600 ml-1">(filtered)</span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
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
