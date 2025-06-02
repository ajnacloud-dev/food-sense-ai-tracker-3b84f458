
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { analysisId } = await req.json()

    console.log('Processing completed analysis:', analysisId)

    // Get the completed analysis
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('pending_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('status', 'completed')
      .single()

    if (analysisError || !analysis) {
      console.error('Analysis not found or not completed:', analysisError)
      throw new Error('Analysis not found or not completed')
    }

    console.log('Found completed analysis:', analysis.category)

    // Process based on category
    if (analysis.category === 'food') {
      await processFoodAnalysis(supabaseClient, analysis)
    }

    // Create notification
    await createNotification(supabaseClient, analysis)

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function processFoodAnalysis(supabaseClient: any, analysis: any) {
  try {
    const result = analysis.analysis_result
    let calories = 0
    let extractedNutrients = null
    let ingredients = null

    console.log('Processing food analysis result structure:', result)

    // Extract calories with multiple fallback paths
    if (result?.meal_summary?.total_nutrition?.calories) {
      calories = result.meal_summary.total_nutrition.calories
    } else if (result?.result?.meal_summary?.total_nutrition?.calories) {
      calories = result.result.meal_summary.total_nutrition.calories
    } else if (result?.calories) {
      calories = typeof result.calories === 'string' ? parseInt(result.calories) : result.calories
    } else if (result?.result?.calories) {
      calories = typeof result.result.calories === 'string' ? parseInt(result.result.calories) : result.result.calories
    }

    // Extract comprehensive nutrition data
    if (result?.meal_summary || result?.food_items) {
      extractedNutrients = {
        meal_summary: result.meal_summary,
        food_items: result.food_items
      }
    } else if (result?.result?.meal_summary || result?.result?.food_items) {
      extractedNutrients = {
        meal_summary: result.result.meal_summary,
        food_items: result.result.food_items
      }
    } else if (result?.result) {
      extractedNutrients = result.result
    }

    // Extract ingredients
    if (result?.food_items && Array.isArray(result.food_items)) {
      ingredients = result.food_items.map((item: any) => ({
        name: item.name,
        serving_size: item.serving_size,
        nutrition: item.nutrition_values
      }))
    } else if (result?.result?.food_items && Array.isArray(result.result.food_items)) {
      ingredients = result.result.food_items.map((item: any) => ({
        name: item.name,
        serving_size: item.serving_size,
        nutrition: item.nutrition_values
      }))
    } else if (result?.result?.ingredients) {
      ingredients = result.result.ingredients
    }

    console.log('Extracted data:', { calories, extractedNutrients, ingredients })

    // Create food entry
    const { data: foodEntry, error: foodError } = await supabaseClient
      .from('food_entries')
      .insert({
        user_id: analysis.user_id,
        description: analysis.description || 'Food Analysis',
        calories: calories || 0,
        ingredients,
        extracted_nutrients: extractedNutrients,
        image_url: analysis.image_url
      })
      .select()
      .single()

    if (foodError) {
      console.error('Error creating food entry:', foodError)
      throw foodError
    }

    console.log('Food entry created successfully:', foodEntry.id)

    // Update analysis with food_entry_id reference
    const { error: updateError } = await supabaseClient
      .from('pending_analyses')
      .update({ 
        analysis_result: { 
          ...result, 
          food_entry_id: foodEntry.id 
        } 
      })
      .eq('id', analysis.id)

    if (updateError) {
      console.error('Error updating analysis with food_entry_id:', updateError)
    }

  } catch (error) {
    console.error('Error processing food analysis:', error)
    throw error
  }
}

async function createNotification(supabaseClient: any, analysis: any) {
  try {
    const title = analysis.status === 'completed' ? 'Analysis Complete' : 'Analysis Failed'
    const message = analysis.status === 'completed' 
      ? `Your ${analysis.category || 'content'} analysis is ready`
      : `Analysis failed: ${analysis.error_message || 'Unknown error'}`

    const { error } = await supabaseClient
      .from('user_notifications')
      .insert({
        user_id: analysis.user_id,
        analysis_id: analysis.id,
        notification_type: analysis.status === 'completed' ? 'analysis_complete' : 'analysis_failed',
        title,
        message,
        read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    console.log('Notification created for analysis:', analysis.id)
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
