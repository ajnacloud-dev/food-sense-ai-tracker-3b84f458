
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
    console.log('Analysis result structure:', JSON.stringify(analysis.analysis_result, null, 2))

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

    console.log('Processing food analysis result structure:', JSON.stringify(result, null, 2))

    // Try to find the actual analysis data - it might be nested in different ways
    let actualAnalysis = null
    
    // Check for different possible nesting structures
    if (result?.analysis) {
      actualAnalysis = result.analysis
      console.log('Found analysis data in result.analysis')
    } else if (result?.result?.analysis) {
      actualAnalysis = result.result.analysis
      console.log('Found analysis data in result.result.analysis')
    } else if (result?.result) {
      actualAnalysis = result.result
      console.log('Found analysis data in result.result')
    } else if (result?.meal_summary || result?.food_items) {
      actualAnalysis = result
      console.log('Found analysis data at root level')
    } else {
      // Try to find any object that contains meal_summary or food_items
      const findAnalysisData = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.meal_summary || obj.food_items) {
            return obj
          }
          for (const key in obj) {
            const found = findAnalysisData(obj[key])
            if (found) return found
          }
        }
        return null
      }
      actualAnalysis = findAnalysisData(result)
      console.log('Found analysis data through deep search:', actualAnalysis ? 'yes' : 'no')
    }

    if (actualAnalysis) {
      console.log('Using analysis data:', JSON.stringify(actualAnalysis, null, 2))
      
      // Extract calories with multiple fallback paths
      if (actualAnalysis.meal_summary?.total_nutrition?.calories) {
        calories = actualAnalysis.meal_summary.total_nutrition.calories
        console.log('Found calories in meal_summary.total_nutrition:', calories)
      } else if (actualAnalysis.calories) {
        calories = typeof actualAnalysis.calories === 'string' ? parseInt(actualAnalysis.calories) : actualAnalysis.calories
        console.log('Found calories at root level:', calories)
      }

      // Extract comprehensive nutrition data
      extractedNutrients = {
        meal_summary: actualAnalysis.meal_summary,
        food_items: actualAnalysis.food_items,
        health_assessment: actualAnalysis.health_assessment
      }

      // Extract ingredients
      if (actualAnalysis.food_items && Array.isArray(actualAnalysis.food_items)) {
        ingredients = actualAnalysis.food_items.map((item: any) => ({
          name: item.name,
          serving_size: item.serving_size,
          nutrition: item.nutrition_values
        }))
        console.log('Extracted ingredients:', ingredients.length, 'items')
      }
    } else {
      console.log('No structured analysis data found, using raw result')
      // Fallback to original extraction logic
      if (result?.meal_summary?.total_nutrition?.calories) {
        calories = result.meal_summary.total_nutrition.calories
      } else if (result?.result?.meal_summary?.total_nutrition?.calories) {
        calories = result.result.meal_summary.total_nutrition.calories
      } else if (result?.calories) {
        calories = typeof result.calories === 'string' ? parseInt(result.calories) : result.calories
      } else if (result?.result?.calories) {
        calories = typeof result.result.calories === 'string' ? parseInt(result.result.calories) : result.result.calories
      }

      extractedNutrients = result
    }

    console.log('Final extracted data:', { calories, extractedNutrients: !!extractedNutrients, ingredients: ingredients?.length || 0 })

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
