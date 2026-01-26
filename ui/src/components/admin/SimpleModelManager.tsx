
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings, CheckCircle } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface Model {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  is_active: boolean;
  is_default: boolean;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
}

const SimpleModelManager = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const { data, error } = await backendApi
        .from('models')
        .select('*')
        .order('name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultModel = async (modelId: string) => {
    try {
      // First, set all models to not default
      await backendApi
        .from('models')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Then set the selected model as default
      const { error } = await backendApi
        .from('models')
        .update({ is_default: true })
        .eq('id', modelId);

      if (error) throw error;

      await loadModels();
      toast.success('Default model updated successfully');
    } catch (error) {
      console.error('Failed to set default model:', error);
      toast.error('Failed to update default model');
    }
  };

  const toggleModelStatus = async (modelId: string, isActive: boolean) => {
    try {
      const { error } = await backendApi
        .from('models')
        .update({ is_active: !isActive })
        .eq('id', modelId);

      if (error) throw error;

      await loadModels();
      toast.success(`Model ${!isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Failed to toggle model status:', error);
      toast.error('Failed to update model status');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Loading models...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Model Management</CardTitle>
            <CardDescription>
              Manage available AI models. Both free and pro users use the same model.
            </CardDescription>
          </div>
          <Button onClick={loadModels} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map((model) => (
          <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{model.name}</h3>
                {model.is_default && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
                <Badge variant={model.is_active ? "default" : "secondary"} className="text-xs">
                  {model.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {model.provider} • {model.model_id}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Input: ${model.input_cost_per_1k_tokens.toFixed(6)}/1K • 
                Output: ${model.output_cost_per_1k_tokens.toFixed(6)}/1K
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => toggleModelStatus(model.id, model.is_active)}
                variant="outline"
                size="sm"
              >
                {model.is_active ? "Disable" : "Enable"}
              </Button>
              {model.is_active && !model.is_default && (
                <Button
                  onClick={() => setDefaultModel(model.id)}
                  variant="default"
                  size="sm"
                >
                  Set Default
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Usage Limits</h4>
              <p className="text-sm text-blue-700">
                Both free and pro users use the same AI model. The difference is in usage limits:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Free users:</strong> 2 analyses per day</li>
                <li>• <strong>Pro users:</strong> Unlimited analyses</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleModelManager;
