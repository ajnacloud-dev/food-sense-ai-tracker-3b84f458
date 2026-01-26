
interface FoodItem {
  name: string;
  nutrition_values?: {
    calories?: number;
  };
  flags?: {
    vegetarian?: boolean;
    vegan?: boolean;
  };
}

interface FoodEntry {
  extracted_nutrients?: {
    food_items?: FoodItem[];
  };
  calories?: number;
}

export interface DietaryBreakdown {
  vegetarianPercentage: number;
  nonVegetarianPercentage: number;
  veganPercentage: number;
  isVegetarian: boolean;
  isVegan: boolean;
  type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'mixed';
  totalItems: number;
  vegetarianItems: number;
  nonVegetarianItems: number;
  veganItems: number;
}

export const calculateVegetarianPercentage = (entry: FoodEntry): {
  percentage: number;
  isVegetarian: boolean;
  isVegan: boolean;
  type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'mixed';
} => {
  const breakdown = calculateDetailedDietaryBreakdown(entry);
  return {
    percentage: breakdown.vegetarianPercentage,
    isVegetarian: breakdown.isVegetarian,
    isVegan: breakdown.isVegan,
    type: breakdown.type
  };
};

export const calculateDetailedDietaryBreakdown = (entry: FoodEntry): DietaryBreakdown => {
  const foodItems = entry.extracted_nutrients?.food_items || [];
  
  if (foodItems.length === 0) {
    return {
      vegetarianPercentage: 0,
      nonVegetarianPercentage: 100,
      veganPercentage: 0,
      isVegetarian: false,
      isVegan: false,
      type: 'non-vegetarian',
      totalItems: 0,
      vegetarianItems: 0,
      nonVegetarianItems: 0,
      veganItems: 0
    };
  }

  let totalCalories = 0;
  let vegetarianCalories = 0;
  let veganCalories = 0;
  let vegetarianItems = 0;
  let veganItems = 0;

  foodItems.forEach(item => {
    const itemCalories = item.nutrition_values?.calories || 0;
    totalCalories += itemCalories;
    
    if (item.flags?.vegetarian) {
      vegetarianItems++;
      vegetarianCalories += itemCalories;
      
      if (item.flags?.vegan) {
        veganItems++;
        veganCalories += itemCalories;
      }
    }
  });

  // Calculate percentages based on calories if available, otherwise by item count
  const vegetarianPercentage = totalCalories > 0 
    ? Math.round((vegetarianCalories / totalCalories) * 100)
    : Math.round((vegetarianItems / foodItems.length) * 100);

  const veganPercentage = totalCalories > 0 
    ? Math.round((veganCalories / totalCalories) * 100)
    : Math.round((veganItems / foodItems.length) * 100);

  const nonVegetarianPercentage = 100 - vegetarianPercentage;
  const nonVegetarianItems = foodItems.length - vegetarianItems;

  const isFullyVegetarian = vegetarianItems === foodItems.length;
  const isFullyVegan = veganItems === foodItems.length && foodItems.length > 0;

  let type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'mixed';
  
  if (isFullyVegan) {
    type = 'vegan';
  } else if (isFullyVegetarian) {
    type = 'vegetarian';
  } else if (vegetarianPercentage === 0) {
    type = 'non-vegetarian';
  } else {
    type = 'mixed';
  }

  return {
    vegetarianPercentage,
    nonVegetarianPercentage,
    veganPercentage,
    isVegetarian: isFullyVegetarian,
    isVegan: isFullyVegan,
    type,
    totalItems: foodItems.length,
    vegetarianItems,
    nonVegetarianItems,
    veganItems
  };
};

export const getVegetarianBadgeColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-100 text-green-700 border-green-200';
  if (percentage >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (percentage > 0) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export const getDietaryDisplayBadges = (breakdown: DietaryBreakdown) => {
  const badges = [];
  
  if (breakdown.isVegan) {
    badges.push({ text: 'Vegan', color: 'bg-green-600 text-white' });
  } else if (breakdown.isVegetarian) {
    badges.push({ text: 'Vegetarian', color: 'bg-green-100 text-green-700 border-green-200' });
  } else if (breakdown.type === 'mixed') {
    if (breakdown.vegetarianPercentage > 0) {
      badges.push({ 
        text: `${breakdown.vegetarianPercentage}% Veg`, 
        color: getVegetarianBadgeColor(breakdown.vegetarianPercentage) 
      });
    }
    if (breakdown.nonVegetarianPercentage > 0) {
      badges.push({ 
        text: `${breakdown.nonVegetarianPercentage}% Non-Veg`, 
        color: 'bg-red-100 text-red-700 border-red-200' 
      });
    }
  } else {
    badges.push({ text: 'Non-Veg', color: 'bg-red-100 text-red-700 border-red-200' });
  }
  
  return badges;
};
