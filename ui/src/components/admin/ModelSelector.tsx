
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Star, Shield, Settings } from "lucide-react";
import { useModelSelection } from "@/hooks/useModelSelection";
import { toast } from "sonner";

interface ModelSelectorProps {
  onModelChange?: (modelId: string) => void;
  selectedModelId?: string;
  className?: string;
}

const ModelSelector = ({ onModelChange, selectedModelId, className }: ModelSelectorProps) => {
  const { 
    defaultModel, 
    loading, 
    error, 
    refreshModels 
  } = useModelSelection();
  
  const [localSelectedId, setLocalSelectedId] = useState(selectedModelId || defaultModel?.model_id || '');

  const handleModelChange = (modelId: string) => {
    setLocalSelectedId(modelId);
    onModelChange?.(modelId);
  };

  const handleRefresh = async () => {
    try {
      await refreshModels();
      toast.success('Models refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh models');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Loading models...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <Button onClick={handleRefresh} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Model Selection</CardTitle>
            <CardDescription>
              Currently using the default model for all users
            </CardDescription>
          </div>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultModel && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Model:</span>
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                <span className="text-sm">{defaultModel.name}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <div className="font-medium capitalize">{defaultModel.provider}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Model ID:</span>
                <div className="font-medium">{defaultModel.model_id}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Vision Support:</span>
                <div className="font-medium">{defaultModel.supports_vision ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Input Cost:</span>
                <div className="font-medium">${defaultModel.input_cost_per_1k_tokens.toFixed(6)}/1K</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Both free and pro users use the same model. The difference is in daily usage limits.
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
