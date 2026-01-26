
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api/client";

interface ReceiptItemsProps {
  receiptId: string;
  fallbackItems?: any[];
}

export const ReceiptItems = ({ receiptId, fallbackItems }: ReceiptItemsProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['receipt-items', receiptId],
    queryFn: async () => {
      const { data, error } = await backendApi
        .from('receipt_items')
        .select('*')
        .eq('receipt_id', receiptId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receipt Items</CardTitle>
          <CardDescription>Loading item details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Loading items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayItems = items && items.length > 0 ? items : fallbackItems;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Items</CardTitle>
        <CardDescription>Detailed breakdown of purchased items</CardDescription>
      </CardHeader>
      <CardContent>
        {displayItems && displayItems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity || 1}</TableCell>
                    <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No item details available.</p>
            <p className="text-sm mt-2">Item breakdown may be available for future receipts.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
