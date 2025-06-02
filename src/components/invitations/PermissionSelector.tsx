
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Utensils, Receipt, Dumbbell, Target, Heart } from "lucide-react";

export type PermissionCategory = 'food_entries' | 'receipts' | 'workouts' | 'goals' | 'health_metrics';

interface PermissionSelectorProps {
  selectedPermissions: PermissionCategory[];
  onPermissionChange: (permissions: PermissionCategory[]) => void;
}

const PermissionSelector = ({ selectedPermissions, onPermissionChange }: PermissionSelectorProps) => {
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

  const handlePermissionToggle = (category: PermissionCategory) => {
    const updatedPermissions = selectedPermissions.includes(category)
      ? selectedPermissions.filter(p => p !== category)
      : [...selectedPermissions, category];
    
    onPermissionChange(updatedPermissions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Access Permissions</CardTitle>
        <CardDescription>
          Select which data categories this caretaker will have access to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
