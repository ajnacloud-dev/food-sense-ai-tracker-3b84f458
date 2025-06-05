
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Receipt, Dumbbell, Target, Heart, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type PermissionCategory = 'food_entries' | 'receipts' | 'workouts' | 'goals' | 'health_metrics';

interface PermissionSelectorProps {
  selectedPermissions: PermissionCategory[];
  onPermissionChange: (permissions: PermissionCategory[]) => void;
}

const PermissionSelector = ({ selectedPermissions, onPermissionChange }: PermissionSelectorProps) => {
  const [permissionMode, setPermissionMode] = useState<'level' | 'custom'>('level');
  const [selectedLevel, setSelectedLevel] = useState<string>('view_only');

  const categories = [
    { 
      key: 'food_entries' as PermissionCategory, 
      label: 'Food Entries', 
      description: 'View meal logs and nutrition data',
      icon: Utensils, 
      color: 'text-green-600' 
    },
    { 
      key: 'receipts' as PermissionCategory, 
      label: 'Receipts', 
      description: 'View grocery receipts and purchases',
      icon: Receipt, 
      color: 'text-blue-600' 
    },
    { 
      key: 'workouts' as PermissionCategory, 
      label: 'Workouts', 
      description: 'View exercise logs and fitness data',
      icon: Dumbbell, 
      color: 'text-purple-600' 
    },
    { 
      key: 'goals' as PermissionCategory, 
      label: 'Goals', 
      description: 'View and set health goals',
      icon: Target, 
      color: 'text-orange-600' 
    },
    { 
      key: 'health_metrics' as PermissionCategory, 
      label: 'Health Metrics', 
      description: 'View health assessments and metrics',
      icon: Heart, 
      color: 'text-red-600' 
    }
  ];

  const permissionLevels = {
    view_only: {
      label: 'View Only',
      description: 'Read-only access to all health data',
      permissions: ['food_entries', 'receipts', 'workouts', 'health_metrics'] as PermissionCategory[]
    },
    interactive: {
      label: 'Interactive',
      description: 'Read access plus ability to add comments and goals',
      permissions: ['food_entries', 'receipts', 'workouts', 'health_metrics', 'goals'] as PermissionCategory[]
    },
    full_access: {
      label: 'Full Access',
      description: 'Complete access to all features and data',
      permissions: ['food_entries', 'receipts', 'workouts', 'health_metrics', 'goals'] as PermissionCategory[]
    }
  };

  const handlePermissionToggle = (category: PermissionCategory) => {
    const updatedPermissions = selectedPermissions.includes(category)
      ? selectedPermissions.filter(p => p !== category)
      : [...selectedPermissions, category];
    
    onPermissionChange(updatedPermissions);
    setPermissionMode('custom');
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setPermissionMode('level');
    const levelPermissions = permissionLevels[level as keyof typeof permissionLevels]?.permissions || [];
    onPermissionChange(levelPermissions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Access Permissions</CardTitle>
        <CardDescription>
          Choose permission level or customize specific access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Level Selector */}
        <div className="space-y-3">
          <Label htmlFor="permission-level">Permission Level</Label>
          <Select value={selectedLevel} onValueChange={handleLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select permission level" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(permissionLevels).map(([key, level]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{level.label}</span>
                    <span className="text-sm text-gray-500">{level.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {permissionMode === 'level' && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    {permissionLevels[selectedLevel as keyof typeof permissionLevels]?.label} includes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {permissionLevels[selectedLevel as keyof typeof permissionLevels]?.permissions.map(perm => {
                      const category = categories.find(c => c.key === perm);
                      return (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {category?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Permission Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Custom Permissions</Label>
            {permissionMode === 'custom' && (
              <Badge variant="outline">Custom Selection</Badge>
            )}
          </div>
          
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedPermissions.includes(category.key);
            
            return (
              <div key={category.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={category.key}
                  checked={isSelected}
                  onCheckedChange={() => handlePermissionToggle(category.key)}
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={category.key} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className={`h-4 w-4 ${category.color}`} />
                    {category.label}
                  </Label>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedPermissions.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No permissions selected. The caretaker will need to request access later.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionSelector;
