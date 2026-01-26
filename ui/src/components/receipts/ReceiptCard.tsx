
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, DollarSign, Calendar, Store, ShoppingCart } from "lucide-react";

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

interface ReceiptCardProps {
  receipt: ReceiptEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ReceiptCard = ({ receipt, onView, onDelete }: ReceiptCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getItemCount = (items: any) => {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    if (items.items && Array.isArray(items.items)) return items.items.length;
    return 0;
  };

  const getSpendingCategory = (amount: number) => {
    if (amount < 25) return { text: 'Small', color: 'bg-green-50 text-green-700 border-green-200' };
    if (amount < 100) return { text: 'Medium', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { text: 'Large', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const handleCardClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    onView(receipt.id);
  };

  const spendingCategory = getSpendingCategory(receipt.total_amount);
  const itemCount = getItemCount(receipt.items);

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 overflow-hidden border hover:border-gray-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          {receipt.image_url && (
            <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0">
              <img
                src={receipt.image_url}
                alt="Receipt"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content Section */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-sm sm:text-base">
                  {receipt.vendor || 'Unknown Vendor'}
                </h3>
                
                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${spendingCategory.color}`}
                  >
                    {spendingCategory.text}
                  </Badge>
                  {itemCount > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {itemCount} items
                    </Badge>
                  )}
                  {receipt.tags && receipt.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Amount and Info */}
                <div className="flex flex-wrap gap-2 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="font-medium">{formatCurrency(receipt.total_amount)}</span>
                  </div>
                  {itemCount > 0 && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{itemCount} items</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(receipt.receipt_date || receipt.created_at)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(receipt.id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(receipt.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
