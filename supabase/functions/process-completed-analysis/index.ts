
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
    console.log('Processing food analysis result:', JSON.stringify(result, null, 2))

    // Extract the actual analysis data
    let actualAnalysis = null
    
    if (result?.analysis) {
      actualAnalysis = result.analysis
    } else if (result?.result?.analysis) {
      actualAnalysis = result.result.analysis
    } else if (result?.result) {
      actualAnalysis = result.result
    } else if (result?.meal_summary || result?.food_items) {
      actualAnalysis = result
    } else {
      const findAnalysisData = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.meal_summary || obj.food_items) return obj
          for (const key in obj) {
            const found = findAnalysisData(obj[key])
            if (found) return found
          }
        }
        return null
      }
      actualAnalysis = findAnalysisData(result)
    }

    if (!actualAnalysis) {
      console.error('No structured analysis data found')
      throw new Error('No structured analysis data found')
    }

    console.log('Using analysis data:', JSON.stringify(actualAnalysis, null, 2))

    // Extract nutrition totals
    const totalNutrition = actualAnalysis.meal_summary?.total_nutrition || {}
    const calories = totalNutrition.calories || 0
    const totalProtein = totalNutrition.proteins || 0
    const totalCarbs = totalNutrition.carbohydrates || 0
    const totalFats = totalNutrition.fats || 0
    const totalFiber = totalNutrition.fiber || 0
    const totalSodium = totalNutrition.sodium || 0

    // Extract meal context
    const mealType = actualAnalysis.meal_summary?.meal_type || null
    const mealTime = actualAnalysis.meal_summary?.time || null
    const mealDate = actualAnalysis.meal_summary?.date || null
    const confidence = actualAnalysis.meal_summary?.classification_confidence || null

    // Generate description from dish names or food items
    let description = analysis.description || 'Food Analysis'
    if (actualAnalysis.meal_summary?.dish_names && actualAnalysis.meal_summary.dish_names.length > 0) {
      description = actualAnalysis.meal_summary.dish_names.join(', ')
    } else if (actualAnalysis.food_items && actualAnalysis.food_items.length > 0) {
      const foodNames = actualAnalysis.food_items.map((item: any) => item.name).filter(Boolean)
      if (foodNames.length > 0) {
        description = foodNames.join(', ')
      }
    }

    // Create/update food entry with normalized data
    const { data: foodEntry, error: foodError } = await supabaseClient
      .from('food_entries')
      .insert({
        user_id: analysis.user_id,
        description: description,
        calories: calories,
        total_protein: totalProtein,
        total_carbohydrates: totalCarbs,
        total_fats: totalFats,
        total_fiber: totalFiber,
        total_sodium: totalSodium,
        meal_type: mealType,
        meal_time: mealTime,
        meal_date: mealDate,
        confidence_score: confidence,
        image_url: analysis.image_url,
        extracted_nutrients: actualAnalysis, // Keep as backup
        ingredients: actualAnalysis.food_items || null
      })
      .select()
      .single()

    if (foodError) {
      console.error('Error creating food entry:', foodError)
      throw foodError
    }

    console.log('Food entry created successfully:', foodEntry.id)

    // Insert individual food items
    if (actualAnalysis.food_items && Array.isArray(actualAnalysis.food_items)) {
      for (const item of actualAnalysis.food_items) {
        const nutrition = item.nutrition_values || {}
        const flags = item.flags || {}
        
        const { error: itemError } = await supabaseClient
          .from('food_items')
          .insert({
            food_entry_id: foodEntry.id,
            name: item.name || 'Unknown Food',
            serving_size: item.serving_size || null,
            calories: nutrition.calories || 0,
            proteins: nutrition.proteins || 0,
            carbohydrates: nutrition.carbohydrates || 0,
            fats: nutrition.fats || 0,
            fiber: nutrition.fiber || 0,
            sodium: nutrition.sodium || 0,
            is_vegetarian: flags.vegetarian || false,
            is_vegan: flags.vegan || false,
            contains_allergens: flags.contains_allergens || false
          })

        if (itemError) {
          console.error('Error creating food item:', itemError)
        }
      }
    }

    // Insert health assessment
    if (actualAnalysis.health_assessment) {
      const health = actualAnalysis.health_assessment
      const nutritionFocus = actualAnalysis.nutrition_focus || {}
      
      const { error: healthError } = await supabaseClient
        .from('health_assessments')
        .insert({
          food_entry_id: foodEntry.id,
          diabetes_rating: health.diabetes?.rating || null,
          diabetes_suggestion: health.diabetes?.suggestion || null,
          hypertension_rating: health.hypertension?.rating || null,
          hypertension_suggestion: health.hypertension?.suggestion || null,
          general_suggestion: nutritionFocus.suggestion || null,
          nutrients_high: nutritionFocus.nutrients_high || [],
          nutrients_low: nutritionFocus.nutrients_low || []
        })

      if (healthError) {
        console.error('Error creating health assessment:', healthError)
      }
    }

    // Insert meal summary
    if (actualAnalysis.meal_summary) {
      const mealSummary = actualAnalysis.meal_summary
      
      const { error: summaryError } = await supabaseClient
        .from('meal_summaries')
        .insert({
          food_entry_id: foodEntry.id,
          dish_names: mealSummary.dish_names || [],
          meal_suggestion: mealSummary.meal_suggestion || null,
          classification_confidence: mealSummary.classification_confidence || null
        })

      if (summaryError) {
        console.error('Error creating meal summary:', summaryError)
      }
    }

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
