import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Receipt, DollarSign, Store, CreditCard, Calendar, Hash, MapPin, Clock, FileText, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import ReceiptAnalysisDebug from "@/components/receipts/ReceiptAnalysisDebug";
import { ReceiptItemCorrection } from "@/components/receipts/ReceiptItemCorrection";

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
      // Use the specific receipt endpoint to get receipt with items
      const response = await api.get(`/v1/receipts/${id}`);

      if (!response.data) {
        throw new Error("Receipt not found");
      }

      setReceipt(response.data);
      setEditedData(response.data);
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
      // Use the PUT endpoint to update receipt
      await api.put(`/v1/app_receipts/${id}`, editedData);

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
      month: 'short',
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

  const receiptData = receipt.items;
  const items = receiptData?.items || receiptData;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => navigate("/app_receipts")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{receipt.vendor}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(receipt.receipt_date || receipt.created_at)}
                      </span>
                      <span className="flex items-center font-semibold text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(receipt.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {setEditing(false); setEditedData(receipt);}}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Image and Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Receipt Image */}
              {receipt.image_url && (
                <Card>
                  <CardContent className="p-4">
                    <img
                      src={receipt.image_url}
                      alt="Receipt"
                      className="w-full rounded-lg shadow-sm"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Financial Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {receiptData?.subtotal && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(receiptData.subtotal)}</span>
                    </div>
                  )}
                  
                  {receiptData?.tax_details?.map((tax: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({(tax.tax_rate * 100).toFixed(1)}%):</span>
                      <span>{formatCurrency(tax.tax_amount || 0)}</span>
                    </div>
                  ))}
                  
                  {receiptData?.discount_details?.map((discount: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discount.discount_name}):</span>
                      <span>-{formatCurrency(discount.discount_amount || 0)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(receiptData?.total || receipt.total_amount)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              {receiptData?.payment && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {receiptData.payment.method && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Method:</span>
                        <Badge variant="outline">{receiptData.payment.method}</Badge>
                      </div>
                    )}
                    {receiptData.payment.card_last_digits && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Card:</span>
                        <span className="font-mono">****{receiptData.payment.card_last_digits}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="merchant">Merchant</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Basic Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Receipt Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Vendor</label>
                        {editing ? (
                          <Input
                            value={editedData.vendor || ''}
                            onChange={(e) => setEditedData({ ...editedData, vendor: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1 font-medium">{receipt.vendor}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Amount</label>
                        {editing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedData.total_amount || 0}
                            onChange={(e) => setEditedData({ ...editedData, total_amount: parseFloat(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1 font-medium">{formatCurrency(receipt.total_amount)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction Details */}
                  {receiptData?.transaction && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Transaction Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {receiptData.transaction.receipt_id && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Receipt ID</label>
                            <p className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{receiptData.transaction.receipt_id}</p>
                          </div>
                        )}
                        {receiptData.transaction.date && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Date & Time</label>
                            <p className="mt-1">
                              {formatDate(receiptData.transaction.date)}
                              {receiptData.transaction.time && ` at ${formatTime(receiptData.transaction.time)}`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="items">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                        Items ({items?.length || 0})
                      </CardTitle>
                      <CardDescription>
                        Purchased items with generic names for price tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!items || !Array.isArray(items) ? (
                        <div className="text-center py-8 text-gray-500">
                          No items found in this receipt
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Desktop View */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-2 font-medium text-gray-700">Item</th>
                                  <th className="pb-2 font-medium text-gray-700">Generic</th>
                                  <th className="pb-2 font-medium text-gray-700">Category</th>
                                  <th className="pb-2 font-medium text-gray-700">Qty</th>
                                  <th className="pb-2 font-medium text-gray-700">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item: any, index: number) => (
                                  <tr key={index} className="border-b last:border-b-0">
                                    <td className="py-3">
                                      <div>
                                        <div className="font-medium">{item.name || '-'}</div>
                                        {item.description && (
                                          <div className="text-sm text-gray-600">{item.description}</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      {item.generic_name ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                          {item.generic_name}
                                        </Badge>
                                      ) : '-'}
                                    </td>
                                    <td className="py-3 text-sm">
                                      {item.category && item.subcategory 
                                        ? `${item.category} > ${item.subcategory}`
                                        : item.category || '-'
                                      }
                                    </td>
                                    <td className="py-3">{item.quantity || 1}</td>
                                    <td className="py-3 font-medium">{formatCurrency(item.price || 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile View */}
                          <div className="md:hidden space-y-3">
                            {items.map((item: any, index: number) => (
                              <Card key={index} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.name || '-'}</h4>
                                    {item.generic_name && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 mt-1 text-xs">
                                        {item.generic_name}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(item.price || 0)}</div>
                                    <div className="text-sm text-gray-600">Qty: {item.quantity || 1}</div>
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}
                                {item.category && (
                                  <div className="text-xs text-gray-500">
                                    {item.category && item.subcategory 
                                      ? `${item.category} > ${item.subcategory}`
                                      : item.category
                                    }
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="merchant">
                  {receiptData?.merchant ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-purple-600" />
                          Merchant Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{receiptData.merchant.store_name}</h3>
                        </div>
                        {receiptData.merchant.store_address && (
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                              <div className="text-gray-600">
                                <p>{receiptData.merchant.store_address}</p>
                                {(receiptData.merchant.city || receiptData.merchant.state || receiptData.merchant.postal_code) && (
                                  <p>
                                    {receiptData.merchant.city && `${receiptData.merchant.city}`}
                                    {receiptData.merchant.state && `, ${receiptData.merchant.state}`}
                                    {receiptData.merchant.postal_code && ` ${receiptData.merchant.postal_code}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        No merchant information available
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="details">
                  <div className="space-y-6">
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

                    {/* Additional Transaction Info */}
                    {receiptData?.transaction?.purchase_channel && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Purchase Channel:</span>
                            <span>{receiptData.transaction.purchase_channel}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ReceiptDetails;
