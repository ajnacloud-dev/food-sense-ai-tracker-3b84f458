
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Save, X, Receipt, DollarSign, Store } from "lucide-react";
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

  const renderItems = (items: any) => {
    if (!items || !Array.isArray(items)) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-sm text-gray-600">{item.description || '-'}</TableCell>
              <TableCell>{item.quantity || 1}</TableCell>
              <TableCell>{formatCurrency(item.price || 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderMerchantInfo = (items: any) => {
    if (!items?.merchant) return null;

    const merchant = items.merchant;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <span className="font-medium">{merchant.store_name}</span>
        </div>
        {merchant.store_address && (
          <p className="text-sm text-gray-600">
            {merchant.store_address}
            {merchant.city && `, ${merchant.city}`}
            {merchant.state && `, ${merchant.state}`}
            {merchant.postal_code && ` ${merchant.postal_code}`}
          </p>
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
      <div className="max-w-4xl mx-auto space-y-6">
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
              <p className="text-gray-600">View and edit your receipt</p>
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

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Purchased items and their details</CardDescription>
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
