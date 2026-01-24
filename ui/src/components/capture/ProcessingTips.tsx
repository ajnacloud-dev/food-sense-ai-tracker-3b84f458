
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const ProcessingTips = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Processing Features</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-600 mb-2">Standard AI Processing</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Fast content classification</li>
              <li>• Direct category analysis</li>
              <li>• Cost-effective processing</li>
              <li>• Reliable for most use cases</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">LangGraph Workflow</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Multi-step analysis pipeline</li>
              <li>• Data enrichment & insights</li>
              <li>• Validation & quality checks</li>
              <li>• Advanced health recommendations</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Image Processing</p>
              <p className="text-yellow-700">Images are processed with automatic fallback from URL to base64 encoding for maximum compatibility with AI vision models.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
