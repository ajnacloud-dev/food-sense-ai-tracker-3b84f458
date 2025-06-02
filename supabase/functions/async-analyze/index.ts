
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pendingAnalysisId, description, imageUrl } = await req.json();

    console.log('Starting optimized async analysis:', {
      pendingAnalysisId,
      description: description?.substring(0, 100),
      hasFile: !!imageUrl
    });

    if (!pendingAnalysisId) {
      return new Response(
        JSON.stringify({ error: 'Missing pendingAnalysisId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify pending analysis exists
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('pending_analyses')
      .select('*')
      .eq('id', pendingAnalysisId)
      .single();

    if (fetchError || !existingAnalysis) {
      console.error('Pending analysis not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Pending analysis not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingAnalysis.status !== 'pending') {
      console.log('Analysis already processed:', existingAnalysis.status);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Analysis already processed or in progress',
          status: existingAnalysis.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update to processing
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Failed to update status:', updateError);
      throw updateError;
    }

    // Start optimized background processing
    EdgeRuntime.waitUntil(processOptimizedAnalysis(
      supabase,
      pendingAnalysisId,
      description,
      imageUrl,
      authHeader
    ));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Optimized analysis started',
        pendingAnalysisId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Async analyze error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processOptimizedAnalysis(
  supabase: any,
  pendingAnalysisId: string,
  description: string,
  imageUrl: string | null,
  authHeader: string
) {
  const startTime = Date.now();
  console.log(`Optimized processing started for ${pendingAnalysisId}`);

  try {
    // Verify analysis is still processing
    const { data: currentAnalysis } = await supabase
      .from('pending_analyses')
      .select('*')
      .eq('id', pendingAnalysisId)
      .single();

    if (!currentAnalysis || currentAnalysis.status !== 'processing') {
      console.log(`Analysis ${pendingAnalysisId} no longer in processing state`);
      return;
    }

    console.log(`Calling optimized LangGraph workflow for ${pendingAnalysisId}`);
    
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Enhanced workflow configuration for optimization
    const workflowConfig = {
      debug: false,
      simplifiedFlow: true,
      optimizeForCost: true,
      useSmartModelSelection: true
    };

    const { data: workflowResult, error: workflowError } = await userSupabase.functions
      .invoke('langgraph-workflow', {
        body: {
          description,
          imageUrl,
          workflowConfig
        },
        headers: {
          Authorization: authHeader
        }
      });

    if (workflowError) {
      console.error(`Optimized workflow error for ${pendingAnalysisId}:`, workflowError);
      throw new Error(`Workflow failed: ${workflowError.message || 'Unknown error'}`);
    }

    console.log(`Optimized workflow completed for ${pendingAnalysisId}`);

    const category = workflowResult.result?.classification?.category || 'unknown';
    
    // Update with results
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'completed',
        category: category,
        analysis_result: workflowResult,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'processing');

    if (updateError) {
      console.error(`Failed to update completed analysis ${pendingAnalysisId}:`, updateError);
      throw updateError;
    }

    // Enhanced data transfer with better schema mapping
    if (category === 'food') {
      await transferOptimizedFoodData(supabase, currentAnalysis, workflowResult);
    } else if (category === 'receipt') {
      await transferOptimizedReceiptData(supabase, currentAnalysis, workflowResult);
    } else if (category === 'workout') {
      await transferOptimizedWorkoutData(supabase, currentAnalysis, workflowResult);
    }

    const duration = Date.now() - startTime;
    console.log(`Optimized analysis ${pendingAnalysisId} completed in ${duration}ms`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Optimized analysis ${pendingAnalysisId} failed after ${duration}ms:`, error);
    
    await supabase
      .from('pending_analyses')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error occurred',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'processing');
  }
}

async function transferOptimizedFoodData(supabase: any, analysis: any, result: any) {
  try {
    const analysisData = result.result?.analysis || {};
    
    // Enhanced nutrition extraction with better defaults
    let calories = 0;
    let ingredients = null;
    
    if (analysisData.meal_summary?.total_nutrition?.calories) {
      calories = analysisData.meal_summary.total_nutrition.calories;
    } else if (analysisData.calories) {
      calories = analysisData.calories;
    }
    
    if (analysisData.food_items && Array.isArray(analysisData.food_items)) {
      ingredients = analysisData.food_items.map((item: any) => ({
        name: item.name || 'Unknown item',
        serving_size: item.serving_size || '1 serving',
        nutrition: item.nutrition_values || {}
      }));
    }

    // Create meaningful description
    let description = analysis.description || 'Food Analysis';
    if (analysisData.meal_summary?.dish_names?.length > 0) {
      const dishes = analysisData.meal_summary.dish_names.filter((dish: string) => 
        dish && dish !== 'unspecified' && dish.trim().length > 0
      );
      if (dishes.length > 0) {
        const mealType = analysisData.meal_summary?.meal_type;
        description = mealType && mealType !== 'unspecified' 
          ? `${mealType}: ${dishes.join(', ')}` 
          : dishes.join(', ');
      }
    }

    const { data: foodEntry, error: insertError } = await supabase
      .from('food_entries')
      .insert({
        user_id: analysis.user_id,
        description: description,
        image_url: analysis.image_url,
        calories: calories,
        ingredients: ingredients,
        extracted_nutrients: analysisData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create optimized food entry:', insertError);
      throw insertError;
    }

    console.log(`Successfully created optimized food entry ${foodEntry.id}`);
    
    await supabase
      .from('pending_analyses')
      .update({
        analysis_result: {
          ...result,
          food_entry_id: foodEntry.id
        }
      })
      .eq('id', analysis.id);

  } catch (error) {
    console.error('Error in optimized food data transfer:', error);
  }
}

async function transferOptimizedReceiptData(supabase: any, analysis: any, result: any) {
  try {
    const analysisData = result.result?.analysis || {};
    
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: analysis.user_id,
        image_url: analysis.image_url,
        vendor: analysisData.merchant?.store_name || analysisData.vendor || 'Unknown Store',
        receipt_date: analysisData.transaction?.date || analysisData.date || new Date().toISOString().split('T')[0],
        total_amount: analysisData.total || 0,
        items: analysisData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create optimized receipt:', insertError);
      throw insertError;
    }

    console.log(`Successfully created optimized receipt ${receipt.id}`);

  } catch (error) {
    console.error('Error in optimized receipt data transfer:', error);
  }
}

async function transferOptimizedWorkoutData(supabase: any, analysis: any, result: any) {
  try {
    const analysisData = result.result?.analysis || {};
    
    const workoutType = analysisData.workout_summary?.workout_type || analysisData.type || 'other';
    const allowedTypes = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
    
    const { data: workout, error: insertError } = await supabase
      .from('workouts')
      .insert({
        user_id: analysis.user_id,
        image_url: analysis.image_url,
        description: analysis.description || 'Workout Analysis',
        workout_type: allowedTypes.includes(workoutType) ? workoutType : 'other',
        duration: analysisData.workout_summary?.duration_minutes || analysisData.duration || 0,
        calories_burned: analysisData.workout_summary?.estimated_calories_burned || analysisData.calories || 0,
        notes: JSON.stringify(analysisData)
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create optimized workout:', insertError);
      throw insertError;
    }

    console.log(`Successfully created optimized workout ${workout.id}`);

  } catch (error) {
    console.error('Error in optimized workout data transfer:', error);
  }
}
