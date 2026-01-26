import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Receipt, Dumbbell, Target, Heart, Info, User, Stethoscope, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PERMISSION_CATEGORIES, CARETAKER_PERMISSION_DEFAULTS, PermissionCategory } from "@/types/permissions";

interface EnhancedPermissionSelectorProps {
  selectedPermissions: PermissionCategory[];
  onPermissionChange: (permissions: PermissionCategory[]) => void;
  caretakerType?: string;
}

const CARETAKER_TYPE_ICONS = {
  dietitian: Utensils,
  personal_trainer: Dumbbell,
  healthcare_provider: Stethoscope,
  family_member: UserCheck
};

const EnhancedPermissionSelector = ({ 
  selectedPermissions, 
  onPermissionChange,
  caretakerType = 'family_member'
}: EnhancedPermissionSelectorProps) => {
  const [selectionMode, setSelectionMode] = useState<'smart' | 'custom'>('smart');

  const getSmartDefaults = (type: string): PermissionCategory[] => {
    return CARETAKER_PERMISSION_DEFAULTS[type] || CARETAKER_PERMISSION_DEFAULTS.family_member;
  };

  const applySmartDefaults = () => {
    const defaults = getSmartDefaults(caretakerType);
    onPermissionChange(defaults);
    setSelectionMode('smart');
  };

  const handlePermissionToggle = (category: PermissionCategory) => {
    const updatedPermissions = selectedPermissions.includes(category)
      ? selectedPermissions.filter(p => p !== category)
      : [...selectedPermissions, category];
    
    onPermissionChange(updatedPermissions);
    setSelectionMode('custom');
  };

  const selectAll = () => {
    onPermissionChange(PERMISSION_CATEGORIES.map(c => c.key));
    setSelectionMode('custom');
  };

  const clearAll = () => {
    onPermissionChange([]);
    setSelectionMode('custom');
  };

  const SmartIcon = CARETAKER_TYPE_ICONS[caretakerType as keyof typeof CARETAKER_TYPE_ICONS] || Users;
  const smartDefaults = getSmartDefaults(caretakerType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SmartIcon className="h-5 w-5 text-blue-600" />
          Data Access Permissions
        </CardTitle>
        <CardDescription>
          Choose what data this caretaker can access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart Defaults Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Recommended for {caretakerType.replace('_', ' ')}</Label>
            <Button
              variant={selectionMode === 'smart' ? 'default' : 'outline'}
              size="sm"
              onClick={applySmartDefaults}
              className="text-xs"
            >
              Use Recommended
            </Button>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            selectionMode === 'smart' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-2">
              <Info className={`h-4 w-4 mt-0.5 ${
                selectionMode === 'smart' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <div className="text-sm">
                <p className={`font-medium mb-1 ${
                  selectionMode === 'smart' ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  Recommended permissions:
                </p>
                <div className="flex flex-wrap gap-1">
                  {smartDefaults.map(permission => {
                    const category = PERMISSION_CATEGORIES.find(c => c.key === permission);
                    return (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {category?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Custom Selection</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="text-xs">
                Clear All
              </Button>
            </div>
          </div>
          
          {selectionMode === 'custom' && (
            <Badge variant="outline" className="text-xs">
              Custom Selection Active
            </Badge>
          )}
          
          <div className="grid gap-3">
            {PERMISSION_CATEGORIES.map((category) => {
              const isSelected = selectedPermissions.includes(category.key);
              const isRecommended = smartDefaults.includes(category.key);
              
              return (
                <div 
                  key={category.key} 
                  className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                    isSelected 
                      ? `${category.bgColor} ${category.borderColor}` 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    id={category.key}
                    checked={isSelected}
                    onCheckedChange={() => handlePermissionToggle(category.key)}
                    className={isSelected ? category.color : ''}
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={category.key} 
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      {category.label}
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Recommended
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            <strong>{selectedPermissions.length}</strong> of {PERMISSION_CATEGORIES.length} permission categories selected
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPermissionSelector;
