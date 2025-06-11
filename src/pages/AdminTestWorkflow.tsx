
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
import { ArrowLeft, Settings, CreditCard, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FunctionConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'production' | 'testing';
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
  // Main Production Function
  {
    name: 'async-analyze',
    displayName: 'Async Analyze (Main)',
    description: 'Primary function for analyzing user content - used by the main application',
    category: 'production',
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
        name: 'skipUsageCheck',
        type: 'boolean',
        label: 'Skip Usage Check (Admin)',
        required: false
      }
    ],
    sampleData: {
      food: "Grilled chicken salad with mixed vegetables and olive oil dressing",
      receipt: "Grocery store receipt from Safeway with milk, eggs, bread and vegetables",
      workout: "30 minute morning jog around the neighborhood park"
    }
  },
  
  // Billing Functions
  {
    name: 'check-subscription',
    displayName: 'Check Subscription',
    description: 'Verify user subscription status with Stripe',
    category: 'production',
    parameters: []
  },
  {
    name: 'create-checkout',
    displayName: 'Create Checkout',
    description: 'Create Stripe checkout session for subscription',
    category: 'production',
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
    category: 'production',
    parameters: []
  },

  // Testing/Development Functions
  {
    name: 'test-langgraph-workflow',
    displayName: 'Test LangGraph Workflow (Dev)',
    description: 'Development function for testing the complete AI analysis workflow',
    category: 'testing',
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
    name: 'test-content-analysis',
    displayName: 'Test Content Analysis (Dev)',
    description: 'Development function for testing direct content analysis with OpenAI',
    category: 'testing',
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
  }
];

const AdminTestWorkflow = () => {
  const navigate = useNavigate();
  const [selectedFunction, setSelectedFunction] = useState<string>('async-analyze');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [category, setCategory] = useState("food");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentConfig = functionConfigs.find(f => f.name === selectedFunction);
  const productionFunctions = functionConfigs.filter(f => f.category === 'production');
  const testingFunctions = functionConfigs.filter(f => f.category === 'testing');

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const loadSampleData = () => {
    if (currentConfig?.sampleData && (selectedFunction === 'async-analyze' || selectedFunction === 'test-langgraph-workflow')) {
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
      let functionName = selectedFunction;

      // Handle test function name mapping
      if (selectedFunction === 'test-langgraph-workflow') {
        functionName = 'langgraph-workflow';
        body = {
          description: parameters.description || '',
          imageUrl: parameters.imageUrl || null,
          workflowConfig: {
            debug: parameters.debug || false,
            testMode: parameters.testMode !== false
          }
        };
      } else if (selectedFunction === 'test-content-analysis') {
        functionName = 'analyze-content';
      } else if (selectedFunction === 'async-analyze') {
        body = {
          pendingAnalysisId: 'test-' + Date.now(),
          description: parameters.description || '',
          imageUrl: parameters.imageUrl || null,
          skipUsageCheck: parameters.skipUsageCheck || true
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body
      });

      if (error) {
        console.error(`${functionName} test error:`, error);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'production':
        return <Settings className="h-4 w-4" />;
      case 'testing':
        return <TestTube className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'production':
        return 'text-green-600 bg-green-50';
      case 'testing':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
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
            Test edge functions with various inputs and configurations
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
                <div className="p-2 text-xs font-semibold text-green-600 bg-green-50 border-b">
                  Production Functions
                </div>
                {productionFunctions.map(config => (
                  <SelectItem key={config.name} value={config.name}>
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-green-600" />
                      {config.displayName}
                    </div>
                  </SelectItem>
                ))}
                <div className="p-2 text-xs font-semibold text-orange-600 bg-orange-50 border-b border-t">
                  Development/Testing Functions
                </div>
                {testingFunctions.map(config => (
                  <SelectItem key={config.name} value={config.name}>
                    <div className="flex items-center gap-2">
                      <TestTube className="h-3 w-3 text-orange-600" />
                      {config.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentConfig && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Badge className={getCategoryColor(currentConfig.category)}>
                  {getCategoryIcon(currentConfig.category)}
                  {currentConfig.category}
                </Badge>
                <p className="text-sm text-muted-foreground flex-1">
                  {currentConfig.description}
                </p>
              </div>
            )}
          </div>

          {/* Sample data section for functions that support it */}
          {(selectedFunction === 'async-analyze' || selectedFunction === 'test-langgraph-workflow') && (
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
          <CardTitle>Function Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Production Functions
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground ml-6">
                {productionFunctions.map(config => (
                  <div key={config.name}>
                    <strong>{config.displayName}</strong>: {config.description}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Development/Testing Functions
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground ml-6">
                {testingFunctions.map(config => (
                  <div key={config.name}>
                    <strong>{config.displayName}</strong>: {config.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Production functions</strong> are used by the main application</p>
            <p>• <strong>Testing functions</strong> are for development and testing purposes only</p>
            <p>• Functions are automatically deployed when code changes</p>
            <p>• Authentication is handled automatically for protected functions</p>
            <p>• Check the function logs in Supabase for detailed debugging information</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Some functions in Supabase may need manual cleanup. 
                If you see unused functions like 'auto-classify-and-analyze' or 'create-notification', 
                please delete them from the Supabase Functions dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestWorkflow;
