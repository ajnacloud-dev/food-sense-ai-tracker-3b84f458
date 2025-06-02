
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

export const calculateVegetarianPercentage = (entry: FoodEntry): {
  percentage: number;
  isVegetarian: boolean;
  isVegan: boolean;
  type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'mixed';
} => {
  const foodItems = entry.extracted_nutrients?.food_items || [];
  
  if (foodItems.length === 0) {
    return { percentage: 0, isVegetarian: false, isVegan: false, type: 'non-vegetarian' };
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

  // Calculate percentage based on calories if available, otherwise by item count
  const percentage = totalCalories > 0 
    ? Math.round((vegetarianCalories / totalCalories) * 100)
    : Math.round((vegetarianItems / foodItems.length) * 100);

  const isFullyVegetarian = vegetarianItems === foodItems.length;
  const isFullyVegan = veganItems === foodItems.length && foodItems.length > 0;

  let type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'mixed';
  
  if (isFullyVegan) {
    type = 'vegan';
  } else if (isFullyVegetarian) {
    type = 'vegetarian';
  } else if (percentage === 0) {
    type = 'non-vegetarian';
  } else {
    type = 'mixed';
  }

  return {
    percentage,
    isVegetarian: isFullyVegetarian,
    isVegan: isFullyVegan,
    type
  };
};

export const getVegetarianBadgeColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-100 text-green-700 border-green-200';
  if (percentage >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (percentage > 0) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};
