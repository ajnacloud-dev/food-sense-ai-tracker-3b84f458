
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";
import { ReceiptStatsCards } from "@/components/receipts/ReceiptStatsCards";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { ReceiptTable } from "@/components/receipts/ReceiptTable";
import { ReceiptFilters, ReceiptFilterState } from "@/components/receipts/ReceiptFilters";
import { filterReceipts, sortReceipts, getUniqueVendors } from "@/utils/receiptUtils";

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
  const [filters, setFilters] = useState<ReceiptFilterState>({
    searchTerm: '',
    vendor: '',
    minAmount: '',
    maxAmount: '',
    dateRange: '',
    sortBy: 'date-desc'
  });

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReceipts(data || []);
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  const handleFiltersChange = (newFilters: ReceiptFilterState) => {
    setFilters(newFilters);
  };

  // Memoized filtered and sorted receipts
  const processedReceipts = useMemo(() => {
    const filtered = filterReceipts(receipts, filters);
    return sortReceipts(filtered, filters.sortBy);
  }, [receipts, filters]);

  const uniqueVendors = useMemo(() => getUniqueVendors(receipts), [receipts]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading receipts...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600">Track your expenses and spending patterns</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => navigate("/capture")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Receipt
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <ReceiptStatsCards receipts={receipts} />

        {/* Filters */}
        <ReceiptFilters 
          onFiltersChange={handleFiltersChange}
          vendors={uniqueVendors}
          totalCount={receipts.length}
          filteredCount={processedReceipts.length}
        />

        {/* Receipts Display */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt History</CardTitle>
            <CardDescription>Your processed receipts and expense tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {processedReceipts.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {receipts.length === 0 ? "No receipts yet" : "No receipts match your filters"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {receipts.length === 0 
                    ? "Start tracking your expenses by adding your first receipt"
                    : "Try adjusting your filters or search terms"
                  }
                </p>
                {receipts.length === 0 && (
                  <Button onClick={() => navigate("/capture")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Receipt
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid gap-4">
                    {processedReceipts.map((receipt) => (
                      <ReceiptCard
                        key={receipt.id}
                        receipt={receipt}
                        onView={(id) => navigate(`/receipts/${id}`)}
                        onDelete={deleteReceipt}
                      />
                    ))}
                  </div>
                ) : (
                  <ReceiptTable
                    receipts={processedReceipts}
                    onView={(id) => navigate(`/receipts/${id}`)}
                    onDelete={deleteReceipt}
                    onRowClick={handleRowClick}
                  />
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
