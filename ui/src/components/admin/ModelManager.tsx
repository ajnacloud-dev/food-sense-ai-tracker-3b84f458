import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, X, Settings, Zap, Star, Shield } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface Model {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  description: string;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
  max_tokens: number;
  supports_vision: boolean;
  is_active: boolean;
  is_default: boolean;
  required_subscription_tier: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  provider: string;
  model_id: string;
  description: string;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
  max_tokens: number;
  supports_vision: boolean;
  is_active: boolean;
  is_default: boolean;
  required_subscription_tier: string;
  category: string;
}

const ModelManager = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    provider: 'openai',
    model_id: '',
    description: '',
    input_cost_per_1k_tokens: 0,
    output_cost_per_1k_tokens: 0,
    max_tokens: 4096,
    supports_vision: false,
    is_active: true,
    is_default: false,
    required_subscription_tier: 'free',
    category: 'general'
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const { data, error } = await backendApi
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing model
        const { error } = await backendApi
          .from('models')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success('Model updated successfully');
        setEditingId(null);
      } else {
        // Create new model
        const { error } = await backendApi
          .from('models')
          .insert(formData);
        
        if (error) throw error;
        toast.success('Model created successfully');
        setShowAddForm(false);
        resetForm();
      }
      
      fetchModels();
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    
    try {
      const { error } = await backendApi
        .from('models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Model deleted successfully');
      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await backendApi
        .from('models')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Model ${isActive ? 'activated' : 'deactivated'}`);
      fetchModels();
    } catch (error) {
      console.error('Error updating model status:', error);
      toast.error('Failed to update model status');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await backendApi
        .from('models')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Default model updated');
      fetchModels();
    } catch (error) {
      console.error('Error setting default model:', error);
      toast.error('Failed to set default model');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'openai',
      model_id: '',
      description: '',
      input_cost_per_1k_tokens: 0,
      output_cost_per_1k_tokens: 0,
      max_tokens: 4096,
      supports_vision: false,
      is_active: true,
      is_default: false,
      required_subscription_tier: 'free',
      category: 'general'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flagship': return <Star className="h-4 w-4" />;
      case 'reasoning': return <Settings className="h-4 w-4" />;
      case 'efficient': return <Zap className="h-4 w-4" />;
      case 'powerful': return <Shield className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
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
    return <div>Loading models...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Models Management</CardTitle>
              <CardDescription>
                Configure AI models with subscription tier requirements and pricing
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Model
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Edit Model' : 'Add New Model'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Model Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., GPT-4 Turbo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model_id">Model ID</Label>
                    <Input
                      id="model_id"
                      value={formData.model_id}
                      onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                      placeholder="e.g., gpt-4-turbo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <select
                      id="provider"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="flagship">Flagship</option>
                      <option value="efficient">Efficient</option>
                      <option value="powerful">Powerful</option>
                      <option value="reasoning">Reasoning</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="subscription_tier">Subscription Tier</Label>
                    <select
                      id="subscription_tier"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.required_subscription_tier}
                      onChange={(e) => setFormData({ ...formData, required_subscription_tier: e.target.value })}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Model description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="input_cost">Input Cost (per 1K tokens)</Label>
                    <Input
                      id="input_cost"
                      type="number"
                      step="0.000001"
                      value={formData.input_cost_per_1k_tokens}
                      onChange={(e) => setFormData({ ...formData, input_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00015"
                    />
                  </div>
                  <div>
                    <Label htmlFor="output_cost">Output Cost (per 1K tokens)</Label>
                    <Input
                      id="output_cost"
                      type="number"
                      step="0.000001"
                      value={formData.output_cost_per_1k_tokens}
                      onChange={(e) => setFormData({ ...formData, output_cost_per_1k_tokens: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0006"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_tokens">Max Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 4096 })}
                      placeholder="4096"
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="supports_vision"
                      checked={formData.supports_vision}
                      onCheckedChange={(checked) => setFormData({ ...formData, supports_vision: checked })}
                    />
                    <Label htmlFor="supports_vision">Supports Vision</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <Label htmlFor="is_default">Default Model</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Update Model' : 'Create Model'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    resetForm();
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Cost (Input/Output)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(model.category)}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {model.name}
                          {model.is_default && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{model.model_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{model.provider}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {model.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(model.required_subscription_tier)}>
                      {model.required_subscription_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>${model.input_cost_per_1k_tokens.toFixed(6)}</div>
                    <div>${model.output_cost_per_1k_tokens.toFixed(6)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={(checked) => handleToggleActive(model.id, checked)}
                      />
                      <span className="text-sm">
                        {model.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(model.id);
                          setFormData({
                            name: model.name,
                            provider: model.provider,
                            model_id: model.model_id,
                            description: model.description || '',
                            input_cost_per_1k_tokens: model.input_cost_per_1k_tokens,
                            output_cost_per_1k_tokens: model.output_cost_per_1k_tokens,
                            max_tokens: model.max_tokens,
                            supports_vision: model.supports_vision,
                            is_active: model.is_active,
                            is_default: model.is_default,
                            required_subscription_tier: model.required_subscription_tier,
                            category: model.category
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!model.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(model.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(model.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelManager;
