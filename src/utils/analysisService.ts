
import { supabase } from "@/integrations/supabase/client";

export const insertAnalysisResult = async (userId: string, category: string, analysis: any, imageUrl: string | null, description: string) => {
  let insertData: any = {
    user_id: userId,
    image_url: imageUrl,
    description: description || 'AI-analyzed content',
  };

  let tableName = '';

  switch (category) {
    case 'food':
      tableName = 'food_entries';
      insertData.calories = analysis.meal_summary?.total_nutrition?.calories || analysis.calories || 0;
      insertData.ingredients = analysis.food_items || analysis.ingredients || {};
      insertData.extracted_nutrients = analysis;
      break;
    case 'receipt':
      tableName = 'receipts';
      insertData.vendor = analysis.merchant?.store_name || analysis.vendor || 'Unknown Store';
      insertData.receipt_date = analysis.transaction?.date || analysis.date || new Date().toISOString().split('T')[0];
      insertData.total_amount = analysis.total || 0;
      insertData.items = analysis;
      break;
    case 'workout':
      tableName = 'workouts';
      const workoutType = analysis.workout_summary?.workout_type || analysis.type || 'other';
      // Ensure workout type is one of the allowed enum values
      const allowedWorkoutTypes = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
      insertData.workout_type = allowedWorkoutTypes.includes(workoutType) ? workoutType : 'other';
      insertData.duration = analysis.workout_summary?.duration_minutes || analysis.duration || 0;
      insertData.calories_burned = analysis.workout_summary?.estimated_calories_burned || analysis.calories || 0;
      insertData.notes = JSON.stringify(analysis);
      break;
    default:
      throw new Error(`Unsupported category: ${category}`);
  }

  const { data, error: insertError } = await supabase
    .from(tableName as any)
    .insert(insertData)
    .select('id')
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    throw insertError;
  }
  
  if (!data) {
    throw new Error('No data returned from insert operation');
  }
  
  if (!data.id) {
    throw new Error('No ID returned from insert operation');
  }
  
  return data.id as string;
};

export const uploadImage = async (file: File, userId: string) => {
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
};
