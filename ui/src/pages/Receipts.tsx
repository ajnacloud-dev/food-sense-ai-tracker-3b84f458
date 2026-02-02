
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, LayoutGrid, List } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { CompactReceiptStatsGrid } from "@/components/receipts/CompactReceiptStatsGrid";
import { ModernReceiptCard } from "@/components/receipts/ModernReceiptCard";
import { ReceiptTable } from "@/components/receipts/ReceiptTable";
import { ModernFilterBar } from "@/components/common/ModernFilterBar";
import { filterReceipts, sortReceipts, getUniqueVendors } from "@/utils/receiptUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReceiptEntry {
  id: string;
  vendor: string;
  receipt_date: string;
  total_amount: number;
  items: any;
  image_url: string;
  tags: string[];
  created_at: string;
  user_id: string;
  description?: string;
  category?: string;
}

const Receipts = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const sortOptions = [
    { value: 'date-desc', label: 'Date (newest first)' },
    { value: 'date-asc', label: 'Date (oldest first)' },
    { value: 'amount-desc', label: 'Amount (high to low)' },
    { value: 'amount-asc', label: 'Amount (low to high)' },
    { value: 'vendor-asc', label: 'Vendor (A-Z)' },
    { value: 'vendor-desc', label: 'Vendor (Z-A)' },
  ];

  const { user } = useAuth(); // Use auth context

  useEffect(() => {
    // In local mode, we can fetch receipts even without user authentication
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      // Use the specific receipts endpoint
      const response = await api.get('/v1/receipts');

      // Backend returns {receipts: [...], total: number}
      const userReceipts = response.data?.receipts || [];

      // Backend already sorts by created_at desc, but we can ensure it
      userReceipts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Fetched receipts:', userReceipts.length);
      setReceipts(userReceipts);
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      // Use the direct DELETE endpoint for receipts
      await api.delete(`/v1/app_receipts/${id}`);

      toast.success("Receipt deleted successfully");
      fetchReceipts();
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast.error("Failed to delete receipt");
    }
  };

  const handleRowClick = (receiptId: string, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/receipts/${receiptId}`);
  };

  // Memoized filtered and sorted receipts
  const processedReceipts = useMemo(() => {
    let filtered = receipts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Vendor filter
    if (selectedVendor && selectedVendor !== 'all') {
      filtered = filtered.filter(receipt => receipt.vendor === selectedVendor);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter(receipt => {
        const amount = receipt.total_amount || 0;
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-desc':
          return (b.total_amount || 0) - (a.total_amount || 0);
        case 'amount-asc':
          return (a.total_amount || 0) - (b.total_amount || 0);
        case 'vendor-asc':
          return (a.vendor || '').localeCompare(b.vendor || '');
        case 'vendor-desc':
          return (b.vendor || '').localeCompare(a.vendor || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [receipts, searchTerm, sortBy, selectedVendor, minAmount, maxAmount]);

  const uniqueVendors = useMemo(() => getUniqueVendors(receipts), [receipts]);

  const hasActiveFilters = selectedVendor !== 'all' || minAmount !== '' || maxAmount !== '';

  const handleClearFilters = () => {
    setSelectedVendor('all');
    setMinAmount('');
    setMaxAmount('');
  };

  const ReceiptAdvancedFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Vendor Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Vendor</Label>
        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger className="border-green-200/60 focus:border-green-400">
            <SelectValue placeholder="Select vendor..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-green-200 shadow-lg">
            <SelectItem value="all">All Vendors</SelectItem>
            {uniqueVendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor} className="hover:bg-green-50">
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Amount Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
          <Input
            type="number"
            placeholder="Max amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="border-green-200/60 focus:border-green-400"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading receipts...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6 animate-fade-in">
        {/* Modern Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Receipt Management
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Track expenses and analyze spending patterns with AI-powered insights</p>
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
              onClick={() => navigate("/capture")}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Receipt
            </Button>
          </div>
        </div>

        {/* Compact Stats Grid */}
        <CompactReceiptStatsGrid receipts={receipts} />

        {/* Modern Filter Bar */}
        <ModernFilterBar
          searchPlaceholder="Search receipts..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          advancedFilters={<ReceiptAdvancedFilters />}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          totalCount={receipts.length}
          filteredCount={processedReceipts.length}
        />

        {/* Receipts Display */}
        <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-green-50/50 to-white pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-green-700">
              <Receipt className="h-5 w-5" />
              Receipt History
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Your processed receipts with AI-powered expense tracking and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {processedReceipts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Receipt className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {receipts.length === 0 ? "No receipts yet" : "No receipts match your filters"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {receipts.length === 0
                    ? "Start tracking your expenses by adding your first receipt with our smart AI analysis"
                    : "Try adjusting your filters or search terms to find what you're looking for"
                  }
                </p>
                {receipts.length === 0 && (
                  <Button
                    onClick={() => navigate("/capture")}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Receipt
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid gap-4">
                    {processedReceipts.map((receipt) => (
                      <ModernReceiptCard
                        key={receipt.id}
                        receipt={receipt}
                        onView={(id) => navigate(`/receipts/${id}`)}
                        onDelete={deleteReceipt}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-green-200/50 overflow-hidden">
                    <ReceiptTable
                      receipts={processedReceipts}
                      onView={(id) => navigate(`/receipts/${id}`)}
                      onDelete={deleteReceipt}
                      onRowClick={handleRowClick}
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

export default Receipts;
