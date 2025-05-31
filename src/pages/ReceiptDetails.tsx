
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Save, X, Receipt, DollarSign, Store, CreditCard, Calendar, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

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

const ReceiptDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ReceiptEntry>>({});

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setReceipt(data);
      setEditedData(data);
    } catch (error: any) {
      console.error('Error fetching receipt:', error);
      toast.error("Failed to load receipt");
      navigate("/receipts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('receipts')
        .update(editedData)
        .eq('id', id);

      if (error) throw error;

      setReceipt({ ...receipt!, ...editedData });
      setEditing(false);
      toast.success("Receipt updated successfully");
    } catch (error: any) {
      console.error('Error updating receipt:', error);
      toast.error("Failed to update receipt");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const renderItems = (receiptData: any) => {
    // Handle both old format (items directly) and new format (items.items)
    const items = receiptData?.items || receiptData;
    
    if (!items || !Array.isArray(items)) {
      console.log('No items found in receipt data:', receiptData);
      return (
        <div className="text-center py-4 text-gray-500">
          No items found in this receipt
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Generic Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>SKU</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.name || '-'}</TableCell>
              <TableCell>
                {item.generic_name ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {item.generic_name}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600 max-w-xs">
                {item.description || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.category && item.subcategory 
                  ? `${item.category} > ${item.subcategory}`
                  : item.category || '-'
                }
              </TableCell>
              <TableCell>{item.quantity || 1}</TableCell>
              <TableCell className="font-medium">{formatCurrency(item.price || 0)}</TableCell>
              <TableCell className="text-sm text-gray-500">{item.sku || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderFinancialSummary = (receiptData: any) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Summary */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Transaction Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(receiptData?.subtotal || 0)}</span>
            </div>
            
            {receiptData?.tax_details?.map((tax: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>Tax ({(tax.tax_rate * 100).toFixed(1)}%):</span>
                <span>{formatCurrency(tax.tax_amount || 0)}</span>
              </div>
            ))}
            
            {receiptData?.discount_details?.map((discount: any, index: number) => (
              <div key={index} className="flex justify-between text-sm text-green-600">
                <span>Discount ({discount.discount_name}):</span>
                <span>-{formatCurrency(discount.discount_amount || 0)}</span>
              </div>
            ))}
            
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(receiptData?.total || receipt?.total_amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Payment Details</h3>
          <div className="space-y-2">
            {receiptData?.payment?.method && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Method: {receiptData.payment.method}</span>
              </div>
            )}
            
            {receiptData?.payment?.card_last_digits && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Card ending: ****{receiptData.payment.card_last_digits}</span>
              </div>
            )}
            
            {receiptData?.payment?.transaction_id && (
              <div className="text-sm text-gray-600">
                Transaction ID: {receiptData.payment.transaction_id}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionDetails = (receiptData: any) => {
    if (!receiptData?.transaction) return null;

    const transaction = receiptData.transaction;
    return (
      <div className="space-y-3">
        {transaction.receipt_id && (
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Receipt ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{transaction.receipt_id}</code>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Date & Time:</span>
          <span>
            {transaction.date && formatDate(transaction.date)}
            {transaction.time && ` at ${formatTime(transaction.time)}`}
          </span>
        </div>
        
        {transaction.purchase_channel && (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Purchase Channel:</span>
            <span>{transaction.purchase_channel}</span>
          </div>
        )}
      </div>
    );
  };

  const renderMerchantInfo = (receiptData: any) => {
    if (!receiptData?.merchant) return null;

    const merchant = receiptData.merchant;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-lg">{merchant.store_name}</span>
        </div>
        
        {merchant.store_address && (
          <div className="text-gray-600 ml-7">
            <p>{merchant.store_address}</p>
            {(merchant.city || merchant.state || merchant.postal_code) && (
              <p>
                {merchant.city && `${merchant.city}`}
                {merchant.state && `, ${merchant.state}`}
                {merchant.postal_code && ` ${merchant.postal_code}`}
              </p>
            )}
            {merchant.country && merchant.country !== 'USA' && (
              <p>{merchant.country}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading receipt...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!receipt) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Receipt not found</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/receipts")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Receipts
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="h-8 w-8 text-blue-500" />
                Receipt Details
              </h1>
              <p className="text-gray-600">View and edit your receipt information</p>
            </div>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => {setEditing(false); setEditedData(receipt);}}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Image */}
        {receipt.image_url && (
          <Card>
            <CardHeader>
              <CardTitle>Receipt Image</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <img
                src={receipt.image_url}
                alt="Receipt"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </CardContent>
          </Card>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Vendor</label>
              {editing ? (
                <Input
                  value={editedData.vendor || ''}
                  onChange={(e) => setEditedData({ ...editedData, vendor: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 mt-1">{receipt.vendor}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Total Amount</label>
              {editing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editedData.total_amount || 0}
                  onChange={(e) => setEditedData({ ...editedData, total_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-gray-900 text-lg font-semibold">{formatCurrency(receipt.total_amount)}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="text-gray-900 mt-1">{formatDate(receipt.receipt_date || receipt.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        {receipt.items?.transaction && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTransactionDetails(receipt.items)}
            </CardContent>
          </Card>
        )}

        {/* Merchant Information */}
        {receipt.items?.merchant && (
          <Card>
            <CardHeader>
              <CardTitle>Merchant Information</CardTitle>
            </CardHeader>
            <CardContent>
              {renderMerchantInfo(receipt.items)}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Breakdown of costs, taxes, and payment details</CardDescription>
          </CardHeader>
          <CardContent>
            {renderFinancialSummary(receipt.items)}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Purchased items with generic names for price tracking across stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderItems(receipt.items)}
          </CardContent>
        </Card>

        {/* Tags */}
        {receipt.tags && receipt.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {receipt.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ReceiptDetails;
