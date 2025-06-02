
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Store, DollarSign, ArrowUpDown } from "lucide-react";
import { useState } from "react";

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

interface ReceiptTableProps {
  receipts: ReceiptEntry[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onRowClick: (receiptId: string, event: React.MouseEvent) => void;
}

type SortField = 'vendor' | 'amount' | 'date' | 'items';
type SortDirection = 'asc' | 'desc';

export const ReceiptTable = ({ receipts, onView, onDelete, onRowClick }: ReceiptTableProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const getItemCount = (items: any) => {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    if (items.items && Array.isArray(items.items)) return items.items.length;
    return 0;
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedReceipts = [...receipts].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'vendor':
        aValue = a.vendor || '';
        bValue = b.vendor || '';
        break;
      case 'amount':
        aValue = a.total_amount || 0;
        bValue = b.total_amount || 0;
        break;
      case 'date':
        aValue = new Date(a.receipt_date || a.created_at).getTime();
        bValue = new Date(b.receipt_date || b.created_at).getTime();
        break;
      case 'items':
        aValue = getItemCount(a.items);
        bValue = getItemCount(b.items);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-gray-400" />
      </div>
    </TableHead>
  );

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="vendor">Vendor</SortableHeader>
            <SortableHeader field="amount">Amount</SortableHeader>
            <SortableHeader field="items">Items</SortableHeader>
            <SortableHeader field="date">Date</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReceipts.map((receipt) => (
            <TableRow 
              key={receipt.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={(e) => onRowClick(receipt.id, e)}
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
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{getItemCount(receipt.items)} items</div>
                  {renderItems(receipt.items)}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(receipt.receipt_date || receipt.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(receipt.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {receipt.image_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(receipt.image_url, '_blank');
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(receipt.id);
                    }}
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
    </div>
  );
};
