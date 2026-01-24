
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ReceiptStatsCardsProps {
  receipts: ReceiptEntry[];
}

export const ReceiptStatsCards = ({ receipts }: ReceiptStatsCardsProps) => {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Receipts</CardTitle>
          <Receipt className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalReceipts}</div>
          <p className="text-xs text-gray-500">Receipts processed</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Spending</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-gray-500">All time</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthAmount)}</div>
          <p className="text-xs text-gray-500">{thisMonthReceipts.length} receipts</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Average Spending</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(avgAmount)}</div>
          <p className="text-xs text-gray-500">Per receipt</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Unique Stores</CardTitle>
          <Store className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{uniqueVendors}</div>
          <p className="text-xs text-gray-500">Different vendors</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Items</CardTitle>
          <ShoppingCart className="h-4 w-4 text-pink-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
          <p className="text-xs text-gray-500">Items purchased</p>
        </CardContent>
      </Card>
    </div>
  );
};
