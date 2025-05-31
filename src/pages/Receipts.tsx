
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, DollarSign, Calendar, Plus, Eye, Trash2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FloatingCaptureButton } from "@/components/capture/FloatingCaptureButton";

interface ReceiptEntry {
  id: string;
  vendor: string;
  receipt_date: string;
  total_amount: number;
  items: any;
  image_url: string;
  tags: string[];
  created_at: string;
}

const Receipts = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalAmount: 0,
    avgAmount: 0,
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
      
      // Calculate stats
      const totalReceipts = data?.length || 0;
      const totalAmount = data?.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0) || 0;
      const avgAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;
      
      setStats({ totalReceipts, totalAmount, avgAmount });
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
    // Prevent row click when clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/receipts/${receiptId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderItems = (items: any) => {
    if (!items || !Array.isArray(items)) return null;
    
    return (
      <div className="text-sm text-gray-600">
        {items.slice(0, 2).map((item: any, index: number) => (
          <div key={index}>{item.name} - {formatCurrency(item.price || 0)}</div>
        ))}
        {items.length > 2 && (
          <div className="text-xs text-gray-500">+{items.length - 2} more items</div>
        )}
      </div>
    );
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600">Track your expenses and spending patterns</p>
          </div>
          <Button onClick={() => navigate("/capture")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Receipt
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReceipts}</div>
              <p className="text-xs text-muted-foreground">Receipts processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">Amount tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Spending</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgAmount)}</div>
              <p className="text-xs text-muted-foreground">Per receipt</p>
            </CardContent>
          </Card>
        </div>

        {/* Receipts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt History</CardTitle>
            <CardDescription>Your processed receipts and expense tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
                <p className="text-gray-600 mb-4">Start tracking your expenses by adding your first receipt</p>
                <Button onClick={() => navigate("/capture")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Receipt
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow 
                      key={receipt.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={(e) => handleRowClick(receipt.id, e)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {receipt.image_url && (
                            <img
                              src={receipt.image_url}
                              alt="Receipt"
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              {receipt.vendor || 'Unknown Vendor'}
                            </div>
                            {receipt.tags && receipt.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {receipt.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(receipt.total_amount || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderItems(receipt.items)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(receipt.receipt_date || receipt.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/receipts/${receipt.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {receipt.image_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(receipt.image_url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteReceipt(receipt.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <FloatingCaptureButton />
    </SidebarLayout>
  );
};

export default Receipts;
