
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Simple, explicit type definitions to avoid deep instantiation
interface SimpleReceiptItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  subcategory?: string;
  sku?: string;
  discount?: number;
}

interface SimpleMerchant {
  store_name?: string;
  store_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface SimpleTransaction {
  date?: string;
  time?: string;
  receipt_id?: string;
  purchase_channel?: string;
}

interface SimpleTaxDetail {
  tax_rate: number;
  tax_amount: number;
}

interface SimpleDiscountDetail {
  discount_name: string;
  discount_amount: number;
}

interface SimplePayment {
  method?: string;
  card_last_digits?: string;
  transaction_id?: string;
}

interface SimpleAnalysisResult {
  items: SimpleReceiptItem[];
  merchant?: SimpleMerchant;
  transaction?: SimpleTransaction;
  subtotal?: number;
  total?: number;
  tax_details?: SimpleTaxDetail[];
  discount_details?: SimpleDiscountDetail[];
  payment?: SimplePayment;
  currency?: string;
  notes?: string;
}

interface ReceiptAnalysisDebugProps {
  receiptId: string;
  analysisResult: SimpleAnalysisResult;
}

interface PendingAnalysisRecord {
  id: string;
  analysis_result: any;
  created_at: string;
  [key: string]: any;
}

export const ReceiptAnalysisDebug = ({ receiptId, analysisResult }: ReceiptAnalysisDebugProps) => {
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysisRecord | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<SimpleReceiptItem[]>([]);

  useEffect(() => {
    fetchPendingAnalysis();
  }, [receiptId]);

  const fetchPendingAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_analyses')
        .select('*')
        .eq('analysis_result->receipt_id', receiptId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setPendingAnalysis(data[0]);
        console.log('Raw analysis result:', data[0].analysis_result);
      }
    } catch (error) {
      console.error('Error fetching pending analysis:', error);
    }
  };

  const analyzeItemConfidence = (item: SimpleReceiptItem): number => {
    let confidence = 0.8;
    
    if (!item.name || item.name.toLowerCase().includes('unknown')) confidence -= 0.3;
    if (!item.price || item.price === 0) confidence -= 0.2;
    if (!item.quantity || item.quantity === 0) confidence -= 0.1;
    if (item.description && item.description.length > 0) confidence += 0.1;
    if (item.category && item.category.length > 0) confidence += 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-50 text-green-700 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  // Safe array access with fallback
  const items: SimpleReceiptItem[] = Array.isArray(analysisResult?.items) ? analysisResult.items : [];
  const suspiciousItems = items.filter((item) => analyzeItemConfidence(item) < 0.6);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Analysis Debug Information
          </CardTitle>
          <CardDescription>
            Review the AI analysis results and identify potential issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{suspiciousItems.length}</div>
              <div className="text-sm text-gray-600">Low Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {items.filter((item) => analyzeItemConfidence(item) >= 0.8).length}
              </div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {items.length > 0 ? ((items.filter((item) => analyzeItemConfidence(item) >= 0.6).length / items.length) * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Items Alert */}
      {suspiciousItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {suspiciousItems.length} items with low confidence scores. These may be hallucinations or misinterpretations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Item Analysis</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
          <TabsTrigger value="prompts">Prompts Used</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Extracted Items</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? 'Cancel Edit' : 'Edit Items'}
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const confidence = analyzeItemConfidence(item);
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="outline" className={getConfidenceColor(confidence)}>
                          {getConfidenceIcon(confidence)}
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>Price: {formatCurrency(item.price || 0)}</div>
                        <div>Qty: {item.quantity || 1}</div>
                        <div>Category: {item.category || 'N/A'}</div>
                        <div>Total: {formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Analysis Result</CardTitle>
              <CardDescription>Complete JSON response from the AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {pendingAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Analysis Record</CardTitle>
                <CardDescription>Database record for this analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(pendingAnalysis, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Prompts</CardTitle>
              <CardDescription>View the prompts used for this receipt analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">System Prompt</h4>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    You are an AI assistant specialized in receipt analysis. You extract ONLY the information that is clearly visible on receipt images with high accuracy. Never hallucinate or add items that are not explicitly shown. Always return valid JSON matching the exact schema provided.
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">User Prompt Template</h4>
                  <div className="bg-green-50 p-4 rounded-lg text-sm">
                    Analyze the receipt image and extract ONLY the items that are clearly visible on the receipt. 
                    Do not hallucinate or add items that are not explicitly shown. 
                    Return JSON matching the provided schema with accurate item names, prices, and quantities.
                    IMPORTANT: Process only what is available and clearly readable.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
