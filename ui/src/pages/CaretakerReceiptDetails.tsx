
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MapPin, CreditCard } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import DetailPageLayout from "@/components/caretaker/DetailPageLayout";
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

const CaretakerReceiptDetailsContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParticipantId, participantData } = useCaretakerData();
  const { hasPermission } = usePermissionStatus(selectedParticipantId);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!selectedParticipantId || !hasPermission('receipts') || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching receipt:', id, 'for participant:', selectedParticipantId);
        
        // Use the specific receipt endpoint to get receipt with items
        const response = await api.get(`/v1/receipts/${id}`);

        if (!response.data) {
          setError('Receipt not found or you don\'t have permission to view it.');
          return;
        }

        const receiptData = response.data;

        // Verify this receipt belongs to the selected participant
        if (receiptData.user_id !== selectedParticipantId) {
          setError('Receipt not found or you don\'t have permission to view it.');
          return;
        }

        console.log('Successfully fetched receipt:', receiptData);
        setReceipt(receiptData);
      } catch (error) {
        console.error('Error fetching receipt:', error);
        setError('Failed to load receipt details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id, selectedParticipantId, hasPermission]);

  const handleBack = () => {
    navigate('/caretaker/receipts');
  };

  const getErrorMessage = () => {
    if (!selectedParticipantId || !participantData) {
      return 'No patient selected. Please select a patient from the sidebar.';
    }
    if (!hasPermission('receipts')) {
      return 'You don\'t have permission to view this patient\'s receipts.';
    }
    return error || 'Receipt not found.';
  };

  const shouldShowContent = selectedParticipantId && hasPermission('receipts') && !loading && receipt;
  const shouldShowError = !loading && (!selectedParticipantId || !hasPermission('receipts') || (!receipt && !loading));

  return (
    <DetailPageLayout
      title="Receipt Details"
      subtitle={participantData ? `Patient: ${participantData.full_name}` : undefined}
      icon={FileText}
      onBack={handleBack}
      backLabel="Back to Receipts"
      isLoading={loading}
      error={shouldShowError ? getErrorMessage() : null}
      loadingMessage="Loading receipt details..."
    >
      {shouldShowContent && receipt && (
        <div className="space-y-6">
          {/* Receipt Header */}
          <Card className="bg-white shadow-lg">
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
                <img 
                  src={receipt.image_url} 
                  alt="Receipt" 
                  className="w-full max-w-md mx-auto rounded-lg border"
                />
              </CardContent>
            )}
          </Card>

          {/* Payment Info */}
          <Card className="bg-white shadow-lg">
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
            <Card className="bg-white shadow-lg">
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
      )}
    </DetailPageLayout>
  );
};

const CaretakerReceiptDetails = () => {
  return (
    <CaretakerDataProvider>
      <SimpleRoleBasedLayout>
        <CaretakerReceiptDetailsContent />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default CaretakerReceiptDetails;
