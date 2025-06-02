
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

    // Extract the authorization token from the incoming request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pendingAnalysisId, description, imageUrl, useAdvanced = false } = await req.json();

    console.log('Starting async analysis:', {
      pendingAnalysisId,
      description: description?.substring(0, 100),
      hasImage: !!imageUrl,
      useAdvanced
    });

    if (!pendingAnalysisId) {
      console.error('Missing pendingAnalysisId');
      return new Response(
        JSON.stringify({ error: 'Missing pendingAnalysisId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, verify the pending analysis exists and is in the correct state
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

    // Only proceed if the analysis is in pending status
    if (existingAnalysis.status !== 'pending') {
      console.log('Analysis already processed or in progress:', existingAnalysis.status);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Analysis already processed or in progress',
          status: existingAnalysis.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    console.log('Updating status to processing for:', pendingAnalysisId);
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'pending'); // Only update if still pending

    if (updateError) {
      console.error('Failed to update status to processing:', updateError);
      throw updateError;
    }

    // Start background analysis with auth token
    console.log('Starting background processing for:', pendingAnalysisId);
    EdgeRuntime.waitUntil(processAnalysisInBackground(
      supabase,
      pendingAnalysisId,
      description,
      imageUrl,
      useAdvanced,
      authHeader // Pass the auth header
    ));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis started in background',
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

async function processAnalysisInBackground(
  supabase: any,
  pendingAnalysisId: string,
  description: string,
  imageUrl: string | null,
  useAdvanced: boolean,
  authHeader: string
) {
  const startTime = Date.now();
  console.log(`Background processing started for ${pendingAnalysisId}`);

  try {
    // Double-check the analysis is still in processing state
    const { data: currentAnalysis, error: checkError } = await supabase
      .from('pending_analyses')
      .select('*')
      .eq('id', pendingAnalysisId)
      .single();

    if (checkError || !currentAnalysis || currentAnalysis.status !== 'processing') {
      console.log(`Analysis ${pendingAnalysisId} is no longer in processing state, aborting`);
      return;
    }

    let result;
    
    if (useAdvanced) {
      console.log(`Calling advanced workflow for ${pendingAnalysisId}`);
      
      // Create a new supabase client for function invocation with user auth
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: workflowResult, error: workflowError } = await userSupabase.functions
        .invoke('langgraph-workflow', {
          body: {
            description,
            imageUrl,
            workflowConfig: null
          },
          headers: {
            Authorization: authHeader
          }
        });

      if (workflowError) {
        console.error(`Advanced workflow error for ${pendingAnalysisId}:`, workflowError);
        throw new Error(`Advanced workflow failed: ${workflowError.message || 'Unknown error'}`);
      }

      console.log(`Advanced workflow completed for ${pendingAnalysisId}`);
      result = workflowResult;
    } else {
      console.log(`Calling standard analysis for ${pendingAnalysisId}`);
      
      // Create a new supabase client for function invocation with user auth
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: analysisResult, error: analysisError } = await userSupabase.functions
        .invoke('auto-classify-and-analyze', {
          body: { description, imageUrl },
          headers: {
            Authorization: authHeader
          }
        });

      if (analysisError) {
        console.error(`Standard analysis error for ${pendingAnalysisId}:`, analysisError);
        throw new Error(`Analysis failed: ${analysisError.message || 'Unknown error'}`);
      }

      console.log(`Standard analysis completed for ${pendingAnalysisId}`);
      result = analysisResult;
    }

    // Extract category from result
    let category = result.category;
    if (!category && result.result?.classification?.category) {
      category = result.result.classification.category;
    }
    if (!category && result.result?.category) {
      category = result.result.category;
    }

    console.log(`Updating analysis ${pendingAnalysisId} as completed with category: ${category}`);

    // Update with successful result, but only if still in processing state
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'completed',
        category: category || 'unknown',
        analysis_result: result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'processing'); // Only update if still processing

    if (updateError) {
      console.error(`Failed to update completed analysis ${pendingAnalysisId}:`, updateError);
      throw updateError;
    }

    // If this is a food analysis, transfer data to food_entries table
    if (category === 'food') {
      console.log(`Transferring food analysis ${pendingAnalysisId} to food_entries table`);
      await transferToFoodEntries(supabase, currentAnalysis, result);
    }

    const duration = Date.now() - startTime;
    console.log(`Analysis ${pendingAnalysisId} completed successfully in ${duration}ms`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Analysis ${pendingAnalysisId} failed after ${duration}ms:`, error);
    
    // Update with error, but only if still in processing state
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error occurred',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId)
      .eq('status', 'processing'); // Only update if still processing

    if (updateError) {
      console.error(`Failed to update failed analysis ${pendingAnalysisId}:`, updateError);
    }
  }
}

async function transferToFoodEntries(supabase: any, analysis: any, result: any) {
  try {
    // Extract nutrition data from the result
    let extractedNutrients = null;
    let calories = 0;
    let ingredients = null;

    // Handle both advanced and standard analysis formats
    if (result.meal_summary || result.food_items) {
      extractedNutrients = {
        meal_summary: result.meal_summary,
        food_items: result.food_items
      };
      
      // Extract calories from meal summary
      if (result.meal_summary?.total_nutrition?.calories) {
        calories = result.meal_summary.total_nutrition.calories;
      }
      
      // Extract ingredients from food items
      if (result.food_items && Array.isArray(result.food_items)) {
        ingredients = result.food_items.map((item: any) => ({
          name: item.name,
          serving_size: item.serving_size,
          nutrition: item.nutrition_values
        }));
      }
    } else if (result.result) {
      // Handle nested result structure
      const analysisData = result.result;
      extractedNutrients = analysisData;
      
      if (analysisData.calories) {
        calories = parseInt(analysisData.calories) || 0;
      }
      
      if (analysisData.ingredients) {
        ingredients = analysisData.ingredients;
      }
    }

    // Create food entry
    const { data: foodEntry, error: insertError } = await supabase
      .from('food_entries')
      .insert({
        user_id: analysis.user_id,
        description: analysis.description || 'Food Analysis',
        image_url: analysis.image_url,
        calories: calories,
        ingredients: ingredients,
        extracted_nutrients: extractedNutrients
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create food entry:', insertError);
      throw insertError;
    }

    console.log(`Successfully created food entry ${foodEntry.id} from analysis ${analysis.id}`);
    
    // Optionally update the pending analysis with a reference to the created food entry
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
    console.error('Error transferring to food entries:', error);
    // Don't throw here - we still want the analysis to be marked as completed
    // even if the transfer fails
  }
}
