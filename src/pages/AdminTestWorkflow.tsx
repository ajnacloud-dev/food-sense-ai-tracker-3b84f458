
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const AdminTestWorkflow = () => {
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("food");
  const [debugMode, setDebugMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sampleData = {
    food: "Grilled chicken salad with mixed vegetables and olive oil dressing",
    receipt: "Grocery store receipt from Safeway with milk, eggs, bread and vegetables",
    workout: "30 minute morning jog around the neighborhood park"
  };

  const handleTest = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('langgraph-workflow', {
        body: {
          description,
          imageUrl: imageUrl || null,
          workflowConfig: {
            debug: debugMode,
            testMode: true
          }
        }
      });

      if (error) {
        console.error('Workflow test error:', error);
        toast.error(`Test failed: ${error.message}`);
        return;
      }

      setResult(data);
      
      if (data.success) {
        toast.success("Workflow test completed successfully");
      } else {
        toast.error(`Workflow failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Test execution error:', error);
      toast.error("Failed to execute test");
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    setDescription(sampleData[category as keyof typeof sampleData]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test the LangGraph workflow with different inputs and configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configure and test the AI analysis workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="workout">Workout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sample Data</Label>
              <Button variant="outline" onClick={loadSampleData} className="w-full">
                Load Sample {category} Data
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description to analyze..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Image URL (Optional)</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
            <Label htmlFor="debug-mode">Debug Mode (include detailed trace data)</Label>
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test Workflow"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Result 
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            {result.metadata && (
              <CardDescription>
                Processing Time: {result.metadata.processingTime}ms | 
                Tokens: {result.metadata.totalTokens} | 
                Cost: ${(result.metadata.totalCost || 0).toFixed(6)}
                {result.metadata.langsmithTraceId && (
                  <> | LangSmith Trace: {result.metadata.langsmithTraceId}</>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Testing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• This tool tests the complete LangGraph workflow including classification, analysis, enrichment, and validation</p>
          <p>• Debug mode includes additional trace data and processing information</p>
          <p>• LangSmith tracing is automatically enabled when configured</p>
          <p>• Test mode bypasses some production-only validations</p>
          <p>• You can also test via direct GET request: <code>/functions/v1/langgraph-workflow/test?category=food&debug=true</code></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestWorkflow;
