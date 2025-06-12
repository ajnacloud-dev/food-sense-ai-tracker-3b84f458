import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar, User, MapPin, CreditCard } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "@/components/caretaker/PermissionStatusIndicator";
import { ImageModal } from "@/components/ui/image-modal";
import { format } from 'date-fns';

interface Receipt {
  id: string;
  vendor: string;
  total_amount: number;
  receipt_date: string;
  receipt_time: string;
  image_url: string;
  payment_method: string;
  card_last_digits: string;
  store_address: string;
  city: string;
  state: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  currency: string;
  user_id: string;
  receipt_items: ReceiptItem[];
}

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  subcategory: string;
}

const CaretakerReceiptDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedParticipantId && hasPermission('receipts') && id) {
      fetchReceipt();
    } else {
      setLoading(false);
    }
  }, [selectedParticipantId, hasPermission, id]);

  const fetchReceipt = async () => {
    if (!selectedParticipantId || !id) return;

    try {
      setLoading(true);
      console.log('CaretakerReceiptDetails: Fetching receipt:', id, 'for participant:', selectedParticipantId);
      
      const { data: receiptData, error } = await supabase
        .from('receipts')
        .select(`
          *,
          receipt_items (*)
        `)
        .eq('id', id)
        .eq('user_id', selectedParticipantId)
        .single();

      if (error) {
        console.error('CaretakerReceiptDetails: Error fetching receipt:', error);
        if (error.message.includes('policy')) {
          toast.error('Access denied. Participant needs to grant permissions.');
        } else {
          throw error;
        }
        return;
      }

      console.log('CaretakerReceiptDetails: Found receipt:', receiptData);
      setReceipt(receiptData);
    } catch (error) {
      console.error('CaretakerReceiptDetails: Error:', error);
      toast.error("Failed to load receipt details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading receipt details...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <RoleBasedLayout>
        <Card>
          <CardHeader>
            <CardTitle>No Participant Selected</CardTitle>
            <CardDescription>
              Please select a participant from the sidebar to view their receipts.
            </CardDescription>
          </CardHeader>
        </Card>
      </RoleBasedLayout>
    );
  }

  if (!hasPermission('receipts')) {
    return (
      <RoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Receipt Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/receipts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Receipts
            </Button>
          </div>
          
          <PermissionStatusIndicator
            hasPermissions={false}
            participantName={participantData.full_name}
            missingCategories={['receipts']}
          />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!receipt) {
    return (
      <RoleBasedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Receipt Details - {participantData.full_name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate('/caretaker/receipts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Receipts
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Receipt Not Found</CardTitle>
              <CardDescription>
                The requested receipt could not be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Receipt Details
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <User className="h-4 w-4" />
              <span>{participantData.full_name}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/caretaker/receipts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Receipts
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Receipt Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {receipt.vendor || 'Unknown Store'}
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {receipt.currency || '$'}{receipt.total_amount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {receipt.receipt_date && format(new Date(receipt.receipt_date), 'MMM dd, yyyy')}
                    {receipt.receipt_time && ` at ${receipt.receipt_time}`}
                  </div>
                </div>
              </div>
              
              {receipt.store_address && (
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {receipt.store_address}
                  {receipt.city && receipt.state && `, ${receipt.city}, ${receipt.state}`}
                </CardDescription>
              )}
            </CardHeader>
            
            {receipt.image_url && (
              <CardContent>
                <ImageModal
                  src={receipt.image_url}
                  alt="Receipt"
                  className="w-full max-w-md mx-auto"
                />
              </CardContent>
            )}
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Payment Method</div>
                  <div className="font-semibold">{receipt.payment_method || 'Unknown'}</div>
                </div>
                {receipt.card_last_digits && (
                  <div>
                    <div className="text-sm text-gray-500">Card Ending</div>
                    <div className="font-semibold">****{receipt.card_last_digits}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Subtotal</div>
                  <div className="font-semibold">{receipt.currency || '$'}{receipt.subtotal?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tax</div>
                  <div className="font-semibold">{receipt.currency || '$'}{receipt.tax_amount?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
              
              {receipt.discount_amount && receipt.discount_amount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">Discount</div>
                  <div className="font-semibold text-green-600">
                    -{receipt.currency || '$'}{receipt.discount_amount.toFixed(2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Items */}
          {receipt.receipt_items && receipt.receipt_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Items Purchased</CardTitle>
                <CardDescription>
                  {receipt.receipt_items.length} item{receipt.receipt_items.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receipt.receipt_items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="text-right">
                          <div className="font-semibold">{receipt.currency || '$'}{item.price?.toFixed(2) || '0.00'}</div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                          )}
                        </div>
                      </div>
                      
                      {(item.category || item.subcategory) && (
                        <div className="flex gap-2 mt-2">
                          {item.category && (
                            <Badge variant="secondary">{item.category}</Badge>
                          )}
                          {item.subcategory && (
                            <Badge variant="outline">{item.subcategory}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerReceiptDetails;
