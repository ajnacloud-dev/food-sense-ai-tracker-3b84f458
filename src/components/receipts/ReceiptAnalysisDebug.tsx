import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  category?: string;
}

interface AnalysisResult {
  items: ReceiptItem[];
}

interface ReceiptAnalysisDebugProps {
  receiptId: string;
  analysisResult: AnalysisResult;
}

interface SimplePendingAnalysis {
  id: string;
  analysis_result: any;
  created_at: string;
  status: string;
  user_id: string;
  description?: string;
  image_url?: string;
  category?: string;
}

export const ReceiptAnalysisDebug = ({ receiptId, analysisResult }: ReceiptAnalysisDebugProps) => {
  const [pendingAnalysis, setPendingAnalysis] = useState<SimplePendingAnalysis | null>(null);

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
      }
    } catch (error) {
      console.error('Error fetching pending analysis:', error);
    }
  };

  const analyzeItemConfidence = (item: ReceiptItem): number => {
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

  const items = analysisResult?.items || [];
  const suspiciousItems = items.filter((item) => analyzeItemConfidence(item) < 0.6);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
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
                {items.length > 0 ? Math.round((items.filter((item) => analyzeItemConfidence(item) >= 0.6).length / items.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {suspiciousItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {suspiciousItems.length} items with low confidence scores. These may be hallucinations or misinterpretations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Item Analysis</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <h3 className="text-lg font-semibold">Extracted Items</h3>
          <div className="space-y-3">
            {items.map((item, index) => {
              const confidence = analyzeItemConfidence(item);
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{item.name || 'Unknown Item'}</h4>
                        <Badge variant="outline" className={getConfidenceColor(confidence)}>
                          {getConfidenceIcon(confidence)}
                          {Math.round(confidence * 100)}%
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
      </Tabs>
    </div>
  );
};
