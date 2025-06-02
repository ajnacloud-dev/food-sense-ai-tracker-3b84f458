
import { supabase } from "@/integrations/supabase/client";

// Type definitions for better type safety
interface InsertResponse {
  id: string;
}

interface FoodEntryData {
  user_id: string;
  image_url: string | null;
  description: string;
  calories: number;
  ingredients: any;
  extracted_nutrients: any;
}

interface ReceiptData {
  user_id: string;
  image_url: string | null;
  vendor: string;
  receipt_date: string;
  total_amount: number;
  items: any;
}

interface WorkoutData {
  user_id: string;
  image_url: string | null;
  description: string;
  workout_type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  duration: number;
  calories_burned: number;
  notes: string;
}

// Ensure storage bucket exists
const ensureStorageBucket = async (): Promise<void> => {
  try {
    // Check if bucket exists by trying to list objects
    const { error } = await supabase.storage.from('uploads').list('', { limit: 1 });
    
    if (error && error.message.includes('not found')) {
      console.log('Storage bucket not found, creating it...');
      
      // Call our edge function to create the bucket
      const { error: setupError } = await supabase.functions.invoke('setup-storage');
      
      if (setupError) {
        console.error('Failed to setup storage bucket:', setupError);
        throw new Error(`Storage setup failed: ${setupError.message}`);
      }
      
      console.log('Storage bucket created successfully');
    }
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    // Don't throw here - let the upload attempt and fail with a more specific error
  }
};

// Helper function to create a meaningful description from analysis
const createMeaningfulDescription = (analysis: any, originalDescription?: string): string => {
  if (originalDescription && originalDescription !== 'AI-analyzed content' && originalDescription.trim().length > 0) {
    return originalDescription;
  }

  // Try to create description from analysis
  if (analysis?.meal_summary?.dish_names && Array.isArray(analysis.meal_summary.dish_names)) {
    const dishes = analysis.meal_summary.dish_names.filter((dish: string) => dish !== 'unspecified' && dish.trim().length > 0);
    if (dishes.length > 0) {
      const mealType = analysis.meal_summary.meal_type && analysis.meal_summary.meal_type !== 'unspecified' 
        ? analysis.meal_summary.meal_type 
        : '';
      return mealType ? `${mealType}: ${dishes.join(', ')}` : dishes.join(', ');
    }
  }

  // Try to get from food items
  if (analysis?.food_items && Array.isArray(analysis.food_items)) {
    const items = analysis.food_items
      .map((item: any) => item.name)
      .filter((name: string) => name !== 'unspecified' && name.trim().length > 0);
    if (items.length > 0) {
      return items.join(', ');
    }
  }

  // Fallback to meal type or generic description
  if (analysis?.meal_summary?.meal_type && analysis.meal_summary.meal_type !== 'unspecified') {
    return `${analysis.meal_summary.meal_type} meal`;
  }

  return originalDescription || 'AI-analyzed content';
};

export const insertAnalysisResult = async (userId: string, category: string, analysis: any, imageUrl: string | null, description: string): Promise<string> => {
  try {
    let entryId: string;

    switch (category) {
      case 'food': {
        // Create meaningful description
        const meaningfulDescription = createMeaningfulDescription(analysis, description);
        
        const foodData: FoodEntryData = {
          user_id: userId,
          image_url: imageUrl,
          description: meaningfulDescription,
          calories: analysis.meal_summary?.total_nutrition?.calories || analysis.calories || 0,
          ingredients: analysis.food_items || analysis.ingredients || {},
          extracted_nutrients: analysis,
        };

        console.log('Inserting food entry with description:', meaningfulDescription);

        const { data, error } = await supabase
          .from('food_entries')
          .insert(foodData)
          .select('id')
          .single();

        if (error) {
          console.error('Food entry insert error:', error);
          throw error;
        }
        
        if (!data?.id) {
          throw new Error('No ID returned from food entry insert');
        }
        
        entryId = data.id;
        break;
      }

      case 'receipt': {
        const receiptData: ReceiptData = {
          user_id: userId,
          image_url: imageUrl,
          vendor: analysis.merchant?.store_name || analysis.vendor || 'Unknown Store',
          receipt_date: analysis.transaction?.date || analysis.date || new Date().toISOString().split('T')[0],
          total_amount: analysis.total || 0,
          items: analysis,
        };

        const { data, error } = await supabase
          .from('receipts')
          .insert(receiptData)
          .select('id')
          .single();

        if (error) {
          console.error('Receipt insert error:', error);
          throw error;
        }
        
        if (!data?.id) {
          throw new Error('No ID returned from receipt insert');
        }
        
        entryId = data.id;
        break;
      }

      case 'workout': {
        const workoutType = analysis.workout_summary?.workout_type || analysis.type || 'other';
        const allowedWorkoutTypes = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
        
        const workoutData: WorkoutData = {
          user_id: userId,
          image_url: imageUrl,
          description: description || 'AI-analyzed content',
          workout_type: allowedWorkoutTypes.includes(workoutType) ? workoutType : 'other',
          duration: analysis.workout_summary?.duration_minutes || analysis.duration || 0,
          calories_burned: analysis.workout_summary?.estimated_calories_burned || analysis.calories || 0,
          notes: JSON.stringify(analysis),
        };

        const { data, error } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select('id')
          .single();

        if (error) {
          console.error('Workout insert error:', error);
          throw error;
        }
        
        if (!data?.id) {
          throw new Error('No ID returned from workout insert');
        }
        
        entryId = data.id;
        break;
      }

      default:
        throw new Error(`Unsupported category: ${category}`);
    }

    console.log(`Successfully inserted ${category} entry with ID: ${entryId}`);
    return entryId;

  } catch (error) {
    console.error(`Failed to insert ${category} analysis result:`, error);
    throw error;
  }
};

export const uploadFile = async (file: File, userId: string) => {
  try {
    // Ensure storage bucket exists before attempting upload
    await ensureStorageBucket();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log(`Uploading file: ${fileName}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // If bucket doesn't exist, try to create it and retry
      if (uploadError.message.includes('not found')) {
        console.log('Bucket not found, attempting to create and retry...');
        await ensureStorageBucket();
        
        // Retry upload
        const { error: retryError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          throw new Error(`Upload failed after retry: ${retryError.message}`);
        }
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);
    
    console.log(`File uploaded successfully: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// Backwards compatibility - alias for uploadFile
export const uploadImage = uploadFile;
