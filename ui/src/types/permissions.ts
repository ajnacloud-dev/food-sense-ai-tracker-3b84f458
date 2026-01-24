
export type PermissionCategory = 'food_entries' | 'receipts' | 'workouts' | 'goals' | 'health_metrics';

export type PermissionLevel = 'none' | 'view' | 'comment' | 'full';

export interface Permission {
  category: PermissionCategory;
  level: PermissionLevel;
  granted: boolean;
}

export interface CaretakerTypeDefaults {
  [key: string]: PermissionCategory[];
}

// Smart defaults based on caretaker type
export const CARETAKER_PERMISSION_DEFAULTS: CaretakerTypeDefaults = {
  dietitian: ['food_entries', 'health_metrics'],
  personal_trainer: ['workouts', 'health_metrics'],
  healthcare_provider: ['food_entries', 'workouts', 'health_metrics', 'goals'],
  family_member: ['food_entries', 'workouts', 'receipts', 'health_metrics']
};

export const PERMISSION_CATEGORIES = [
  { 
    key: 'food_entries' as PermissionCategory, 
    label: 'Food Entries', 
    description: 'View meal logs and nutrition data',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  { 
    key: 'receipts' as PermissionCategory, 
    label: 'Receipts', 
    description: 'View grocery receipts and purchases',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    key: 'workouts' as PermissionCategory, 
    label: 'Workouts', 
    description: 'View exercise logs and fitness data',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  { 
    key: 'goals' as PermissionCategory, 
    label: 'Goals', 
    description: 'View and set health goals',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  { 
    key: 'health_metrics' as PermissionCategory, 
    label: 'Health Metrics', 
    description: 'View health assessments and metrics',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];
