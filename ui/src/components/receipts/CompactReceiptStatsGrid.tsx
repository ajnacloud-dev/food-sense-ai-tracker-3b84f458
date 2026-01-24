
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, DollarSign, Calendar, TrendingUp, Store, ShoppingCart } from "lucide-react";

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

interface CompactReceiptStatsGridProps {
  receipts: ReceiptEntry[];
}

export const CompactReceiptStatsGrid = ({ receipts }: CompactReceiptStatsGridProps) => {
  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);
  const avgAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

  // Calculate this month's spending
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.receipt_date || receipt.created_at);
    return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
  });
  const thisMonthAmount = thisMonthReceipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);

  // Get unique vendors
  const uniqueVendors = new Set(receipts.map(receipt => receipt.vendor).filter(Boolean)).size;

  // Get total items
  const totalItems = receipts.reduce((sum, receipt) => {
    if (!receipt.items) return sum;
    if (Array.isArray(receipt.items)) return sum + receipt.items.length;
    if (receipt.items.items && Array.isArray(receipt.items.items)) return sum + receipt.items.items.length;
    return sum;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Total Receipts</p>
              <p className="text-xl font-bold">{totalReceipts}</p>
            </div>
            <Receipt className="h-6 w-6 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Spending</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">This Month</p>
              <p className="text-xl font-bold">{formatCurrency(thisMonthAmount)}</p>
            </div>
            <Calendar className="h-6 w-6 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Avg Spending</p>
              <p className="text-xl font-bold">{formatCurrency(avgAmount)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-medium">Unique Stores</p>
              <p className="text-xl font-bold">{uniqueVendors}</p>
            </div>
            <Store className="h-6 w-6 text-indigo-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium">Total Items</p>
              <p className="text-xl font-bold">{totalItems}</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-emerald-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
