
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, DollarSign, Calendar, Store, ShoppingCart, FileText } from "lucide-react";

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

interface ModernReceiptCardProps {
  receipt: ReceiptEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ModernReceiptCard = ({ receipt, onView, onDelete }: ModernReceiptCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
      className="nw-card-modern hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-green-200/50"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Image or Icon Section */}
          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            {receipt.image_url ? (
              <img
                src={receipt.image_url}
                alt="Receipt"
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="h-8 w-8 text-green-600" />
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {receipt.vendor || 'Unknown Vendor'}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(receipt.receipt_date || receipt.created_at)}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(receipt.id);
                  }}
                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(receipt.id);
                  }}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Amount and Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">
                  {formatCurrency(receipt.total_amount)}
                </span>
              </div>
              
              {itemCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ShoppingCart className="h-3 w-3" />
                  <span>{itemCount} items</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-1 mt-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${spendingCategory.color}`}
              >
                {spendingCategory.text}
              </Badge>
              {receipt.tags && receipt.tags.slice(0, 1).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
