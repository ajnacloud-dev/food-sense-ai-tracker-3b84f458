
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarDate } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Receipt {
  id: string;
  created_at: string;
  description?: string;
  image_url?: string;
  category?: string;
  user_id: string;
  vendor?: string;
  total_amount?: number;
  receipt_date?: string;
}

interface ReceiptTableProps {
  participantId?: string;
  receipts?: Receipt[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onRowClick?: (receiptId: string, event: React.MouseEvent) => void;
}

export const ReceiptTable = ({ 
  participantId, 
  receipts: propReceipts,
  onView,
  onDelete,
  onRowClick 
}: ReceiptTableProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>(propReceipts || []);
  const [loading, setLoading] = useState(!propReceipts);
  const [filters, setFilters] = useState({
    date: null as Date | null,
    category: ''
  });

  const { user } = useAuth();
  const targetUserId = participantId || user?.id;

  const fetchReceipts = async () => {
    if (!targetUserId || propReceipts) return;

    try {
      setLoading(true);
      console.log('ReceiptTable: Fetching receipts for user:', targetUserId);

      let query = supabase
        .from('receipts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (filters.date) {
        const formattedDate = format(filters.date, 'yyyy-MM-dd');
        query = query.gte('created_at', `${formattedDate} 00:00:00`).lte('created_at', `${formattedDate} 23:59:59`);
      }

      if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('ReceiptTable: Error fetching receipts:', error);
        throw error;
      }

      console.log('ReceiptTable: Fetched receipts:', data?.length || 0);
      setReceipts(data || []);
    } catch (error) {
      console.error('ReceiptTable: Error:', error);
      toast.error('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propReceipts) {
      fetchReceipts();
    }
  }, [targetUserId, filters, propReceipts]);

  useEffect(() => {
    if (propReceipts) {
      setReceipts(propReceipts);
      setLoading(false);
    }
  }, [propReceipts]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: null,
      category: ''
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy - hh:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleView = (id: string) => {
    if (onView) {
      onView(id);
    }
  };

  const handleRowClick = (receiptId: string, event: React.MouseEvent) => {
    if (onRowClick) {
      onRowClick(receiptId, event);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48">Loading receipts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>
          View and manage financial records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!propReceipts && (
          <div className="grid gap-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Filter by Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.date ? format(filters.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarDate
                      mode="single"
                      selected={filters.date}
                      onSelect={(date) => handleFilterChange('date', date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="category">Filter by Category</Label>
                <Input
                  type="text"
                  id="category"
                  placeholder="Category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                />
              </div>

              <div>
                <Button onClick={clearFilters} variant="secondary">
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {receipts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No receipts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow 
                    key={receipt.id}
                    onClick={(e) => handleRowClick && handleRowClick(receipt.id, e)}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                  >
                    <TableCell>{formatDate(receipt.receipt_date || receipt.created_at)}</TableCell>
                    <TableCell>{receipt.vendor || 'N/A'}</TableCell>
                    <TableCell>${(receipt.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{receipt.category || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(receipt.id);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptTable;
