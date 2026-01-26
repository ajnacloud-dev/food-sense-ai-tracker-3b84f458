
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

type PromptCategory = 'food' | 'receipt' | 'workout' | 'general';

interface Prompt {
  id: string;
  category: PromptCategory;
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  category: PromptCategory;
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
}

const PromptManager = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    category: 'food',
    name: '',
    system_prompt: '',
    user_prompt_template: '',
    is_active: true
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await backendApi
        .from('prompts')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (prompt?: Prompt) => {
    try {
      const dataToSave = prompt || formData;
      
      if (editingId) {
        // Update existing prompt
        const { error } = await backendApi
          .from('prompts')
          .update(dataToSave)
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success('Prompt updated successfully');
        setEditingId(null);
      } else {
        // Create new prompt
        const { error } = await backendApi
          .from('prompts')
          .insert(dataToSave);
        
        if (error) throw error;
        toast.success('Prompt created successfully');
        setShowAddForm(false);
        setFormData({
          category: 'food',
          name: '',
          system_prompt: '',
          user_prompt_template: '',
          is_active: true
        });
      }
      
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const { error } = await backendApi
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Prompt deleted successfully');
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await backendApi
        .from('prompts')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Prompt ${isActive ? 'activated' : 'deactivated'}`);
      fetchPrompts();
    } catch (error) {
      console.error('Error updating prompt status:', error);
      toast.error('Failed to update prompt status');
    }
  };

  const categories: PromptCategory[] = ['food', 'receipt', 'workout', 'general'];

  if (loading) {
    return <div>Loading prompts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Prompts Management</CardTitle>
              <CardDescription>
                Configure system and user prompts for different content categories
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Prompt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Add New Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PromptCategory })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Prompt name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="system_prompt">System Prompt</Label>
                  <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    placeholder="System instructions for the AI..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="user_prompt_template">User Prompt Template</Label>
                  <Textarea
                    id="user_prompt_template"
                    value={formData.user_prompt_template}
                    onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
                    placeholder="User prompt template (use {description} placeholder)..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSave()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Prompt
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
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
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>System Prompt</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <Badge variant="outline">{prompt.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{prompt.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{prompt.system_prompt}</TableCell>
                  <TableCell>
                    <Switch
                      checked={prompt.is_active}
                      onCheckedChange={(checked) => handleToggleActive(prompt.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(prompt.id);
                          setFormData({
                            category: prompt.category,
                            name: prompt.name,
                            system_prompt: prompt.system_prompt,
                            user_prompt_template: prompt.user_prompt_template,
                            is_active: prompt.is_active
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(prompt.id)}
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

export default PromptManager;
