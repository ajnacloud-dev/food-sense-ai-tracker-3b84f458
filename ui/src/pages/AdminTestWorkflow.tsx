import { useState } from "react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FunctionConfig {
  name: string;
  displayName: string;
  description: string;
  parameters: Array<{
    name: string;
    type: 'text' | 'textarea' | 'url' | 'boolean' | 'select' | 'number';
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>;
  sampleData?: Record<string, any>;
}

const functionConfigs: FunctionConfig[] = [
  {
    name: 'langgraph-workflow',
    displayName: 'LangGraph Workflow',
    description: 'Test the complete AI analysis workflow including classification, analysis, enrichment, and validation',
    parameters: [
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: false,
        placeholder: 'Enter description to analyze...'
      },
      {
        name: 'imageUrl',
        type: 'url',
        label: 'Image URL',
        required: false,
        placeholder: 'https://example.com/image.jpg'
      },
      {
        name: 'debug',
        type: 'boolean',
        label: 'Debug Mode',
        required: false
      },
      {
        name: 'testMode',
        type: 'boolean',
        label: 'Test Mode',
        required: false
      }
    ],
    sampleData: {
      food: "Grilled chicken salad with mixed vegetables and olive oil dressing",
      receipt: "Grocery store receipt from Safeway with milk, eggs, bread and vegetables",
      workout: "30 minute morning jog around the neighborhood park"
    }
  },
  {
    name: 'analyze-content',
    displayName: 'Analyze Content',
    description: 'Direct content analysis using OpenAI with category-specific prompts',
    parameters: [
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: true,
        placeholder: 'Enter content to analyze...'
      },
      {
        name: 'imageUrl',
        type: 'url',
        label: 'Image URL',
        required: false,
        placeholder: 'https://example.com/image.jpg'
      },
      {
        name: 'category',
        type: 'select',
        label: 'Category',
        required: true,
        options: ['food', 'receipt', 'workout']
      }
    ]
  },
  {
    name: 'check-subscription',
    displayName: 'Check Subscription',
    description: 'Verify user subscription status with Stripe',
    parameters: []
  },
  {
    name: 'create-checkout',
    displayName: 'Create Checkout',
    description: 'Create Stripe checkout session for subscription',
    parameters: [
      {
        name: 'priceId',
        type: 'text',
        label: 'Price ID',
        required: false,
        placeholder: 'price_1234567890'
      }
    ]
  },
  {
    name: 'customer-portal',
    displayName: 'Customer Portal',
    description: 'Create Stripe customer portal session',
    parameters: []
  }
];

const AdminTestWorkflow = () => {
  const navigate = useNavigate();
  const [selectedFunction, setSelectedFunction] = useState<string>('langgraph-workflow');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [category, setCategory] = useState("food");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentConfig = functionConfigs.find(f => f.name === selectedFunction);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const loadSampleData = () => {
    if (currentConfig?.sampleData && selectedFunction === 'langgraph-workflow') {
      const sampleDesc = currentConfig.sampleData[category as keyof typeof currentConfig.sampleData];
      handleParameterChange('description', sampleDesc);
    }
  };

  const handleTest = async () => {
    if (!currentConfig) {
      toast.error("Please select a function to test");
      return;
    }

    // Validate required parameters
    const requiredParams = currentConfig.parameters.filter(p => p.required);
    for (const param of requiredParams) {
      if (!parameters[param.name] || parameters[param.name].toString().trim() === '') {
        toast.error(`${param.label} is required`);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      let body: any = { ...parameters };

      // Special handling for langgraph-workflow
      if (selectedFunction === 'langgraph-workflow') {
        body = {
          description: parameters.description || '',
          imageUrl: parameters.imageUrl || null,
          workflowConfig: {
            debug: parameters.debug || false,
            testMode: parameters.testMode !== false // default to true
          }
        };
      }

      const { data, error } = await backendApi.functions.invoke(selectedFunction, {
        body: body
      });

      if (error) {
        console.error(`${selectedFunction} test error:`, error);
        toast.error(`Test failed: ${error.message}`);
        return;
      }

      setResult(data);
      
      if (data.success !== false) {
        toast.success("Function test completed successfully");
      } else {
        toast.error(`Function failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test execution error:', error);
      toast.error("Failed to execute test");
    } finally {
      setLoading(false);
    }
  };

  const renderParameterField = (param: FunctionConfig['parameters'][0]) => {
    const value = parameters[param.name] || '';

    switch (param.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            rows={3}
          />
        );
      
      case 'url':
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            type={param.type === 'url' ? 'url' : 'text'}
          />
        );
      
      case 'number':
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
            placeholder={param.placeholder}
            type="number"
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
          />
        );
      
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => handleParameterChange(param.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Function Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test different edge functions with various inputs and configurations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Select a function and configure its parameters for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Function</Label>
            <Select value={selectedFunction} onValueChange={setSelectedFunction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {functionConfigs.map(config => (
                  <SelectItem key={config.name} value={config.name}>
                    {config.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentConfig && (
              <p className="text-sm text-muted-foreground">
                {currentConfig.description}
              </p>
            )}
          </div>

          {/* Special sample data section for langgraph-workflow */}
          {selectedFunction === 'langgraph-workflow' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sample Category</Label>
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
          )}

          {/* Dynamic parameter fields */}
          {currentConfig?.parameters.map(param => (
            <div key={param.name} className="space-y-2">
              <Label className="flex items-center gap-2">
                {param.label}
                {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </Label>
              {renderParameterField(param)}
            </div>
          ))}

          <Button onClick={handleTest} disabled={loading || !currentConfig} className="w-full">
            {loading ? "Testing..." : `Test ${currentConfig?.displayName || 'Function'}`}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Result 
              <Badge variant={result.success !== false ? "default" : "destructive"}>
                {result.success !== false ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            {result.metadata && (
              <CardDescription>
                {result.metadata.processingTime && `Processing Time: ${result.metadata.processingTime}ms | `}
                {result.metadata.totalTokens && `Tokens: ${result.metadata.totalTokens} | `}
                {result.metadata.totalCost !== undefined && `Cost: $${(result.metadata.totalCost || 0).toFixed(6)}`}
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
          <CardTitle>Available Functions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {functionConfigs.map(config => (
            <div key={config.name}>
              <strong>{config.displayName}</strong>: {config.description}
            </div>
          ))}
          <div className="mt-4 pt-4 border-t">
            <p>• Functions are automatically deployed when code changes</p>
            <p>• Authentication is handled automatically for protected functions</p>
            <p>• Check the function logs in Supabase for detailed debugging information</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestWorkflow;
