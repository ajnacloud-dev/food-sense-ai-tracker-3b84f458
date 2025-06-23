
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
    availableModels, 
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flagship': return <Star className="h-3 w-3" />;
      case 'reasoning': return <Settings className="h-3 w-3" />;
      case 'efficient': return <Zap className="h-3 w-3" />;
      case 'powerful': return <Shield className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
              Choose from available models based on your subscription
            </CardDescription>
          </div>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Model</label>
          <Select value={localSelectedId} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.model_id}>
                  <div className="flex items-center gap-2 w-full">
                    {getCategoryIcon(model.category)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {model.name}
                        {model.is_default && (
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {model.provider} • {model.category}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getTierColor(model.required_subscription_tier)}`}>
                      {model.required_subscription_tier}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Details */}
        {localSelectedId && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            {(() => {
              const selectedModel = availableModels.find(m => m.model_id === localSelectedId);
              if (!selectedModel) return null;
              
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Selected Model:</span>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(selectedModel.category)}
                      <span className="text-sm">{selectedModel.name}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Provider:</span>
                      <div className="font-medium capitalize">{selectedModel.provider}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <div className="font-medium capitalize">{selectedModel.category}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vision Support:</span>
                      <div className="font-medium">{selectedModel.supports_vision ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Input Cost:</span>
                      <div className="font-medium">${selectedModel.input_cost_per_1k_tokens.toFixed(6)}/1K</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Models are automatically selected based on content complexity and your subscription tier.
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
