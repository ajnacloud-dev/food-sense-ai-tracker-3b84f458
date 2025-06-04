
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DebugData {
  [key: string]: any;
}

interface ReceiptAnalysisDebugProps {
  analysisData?: DebugData;
  rawResponse?: string;
  processingSteps?: string[];
}

const ReceiptAnalysisDebug = ({ 
  analysisData, 
  rawResponse, 
  processingSteps 
}: ReceiptAnalysisDebugProps) => {
  if (!analysisData && !rawResponse && !processingSteps) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysisData && (
            <div>
              <h4 className="font-semibold mb-2">Analysis Data:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </div>
          )}
          
          {rawResponse && (
            <div>
              <h4 className="font-semibold mb-2">Raw Response:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {rawResponse}
              </pre>
            </div>
          )}
          
          {processingSteps && (
            <div>
              <h4 className="font-semibold mb-2">Processing Steps:</h4>
              <ul className="list-disc list-inside space-y-1">
                {processingSteps.map((step, index) => (
                  <li key={index} className="text-sm">{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptAnalysisDebug;
