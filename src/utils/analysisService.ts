
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
  description: string;
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

export const insertAnalysisResult = async (userId: string, category: string, analysis: any, imageUrl: string | null, description: string): Promise<string> => {
  try {
    let entryId: string;

    switch (category) {
      case 'food': {
        const foodData: FoodEntryData = {
          user_id: userId,
          image_url: imageUrl,
          description: description || 'AI-analyzed content',
          calories: analysis.meal_summary?.total_nutrition?.calories || analysis.calories || 0,
          ingredients: analysis.food_items || analysis.ingredients || {},
          extracted_nutrients: analysis,
        };

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
          description: description || 'AI-analyzed content',
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

export const uploadImage = async (file: File, userId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log(`Uploading file: ${fileName}, Size: ${file.size} bytes`);
    
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};
