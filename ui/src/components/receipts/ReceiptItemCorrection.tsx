
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface ReceiptItemCorrectionProps {
  receiptId: string;
  items: any[];
  onItemsUpdated: (items: any[]) => void;
}

export const ReceiptItemCorrection = ({ receiptId, items, onItemsUpdated }: ReceiptItemCorrectionProps) => {
  const [editedItems, setEditedItems] = useState(items);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = editedItems.filter((_, i) => i !== index);
    setEditedItems(updated);
  };

  const addItem = () => {
    const newItem = {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      category: '',
      subcategory: ''
    };
    setEditedItems([...editedItems, newItem]);
  };

  const saveCorrections = async () => {
    setSaving(true);
    try {
      // Update the receipt items in the database
      const { error } = await backendApi
        .from('app_receipts')
        .update({
          items: { items: editedItems },
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId);

      if (error) throw error;

      // Also update individual receipt_items if the table exists
      try {
        // First, delete existing items
        await backendApi
          .from('receipt_items')
          .delete()
          .eq('receipt_id', receiptId);

        // Then insert corrected items
        const itemsToInsert = editedItems.map(item => ({
          receipt_id: receiptId,
          name: item.name,
          description: item.description || null,
          price: item.price || 0,
          quantity: item.quantity || 1,
          category: item.category || null,
          subcategory: item.subcategory || null,
          sku: item.sku || null,
          discount: item.discount || 0
        }));

        if (itemsToInsert.length > 0) {
          await backendApi
            .from('receipt_items')
            .insert(itemsToInsert);
        }
      } catch (itemError) {
        console.log('Receipt items table update failed (may not exist):', itemError);
      }

      onItemsUpdated(editedItems);
      toast.success("Receipt items updated successfully");
    } catch (error) {
      console.error('Error saving corrections:', error);
      toast.error("Failed to save corrections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Correct Receipt Items</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <Button 
              size="sm" 
              onClick={saveCorrections}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {editedItems.map((item, index) => (
            <Card key={index} className="p-4 border-l-4 border-l-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Item Name *</Label>
                  <Input
                    id={`name-${index}`}
                    value={item.name || ''}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`price-${index}`}>Price *</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={item.price || 0}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`category-${index}`}>Category</Label>
                  <Input
                    id={`category-${index}`}
                    value={item.category || ''}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                    placeholder="e.g., Grocery, Electronics"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Additional details"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">
                  Total: ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </Badge>
                {item.sku && (
                  <Badge variant="secondary">SKU: {item.sku}</Badge>
                )}
              </div>
            </Card>
          ))}
          
          {editedItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items found. Click "Add Item" to add receipt items manually.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
