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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { pendingAnalysisId, category, analysisResult } = await req.json()

    console.log('Processing completed analysis:', { pendingAnalysisId, category })

    if (category === 'food' && analysisResult) {
      await processFoodAnalysis(supabaseClient, analysisResult, pendingAnalysisId)
    } else if (category === 'receipt' && analysisResult) {
      await processReceiptAnalysis(supabaseClient, analysisResult, pendingAnalysisId)
    } else if (category === 'workout' && analysisResult) {
      await processWorkoutAnalysis(supabaseClient, analysisResult, pendingAnalysisId)
    }

    // Create notification
    const { data: pendingAnalysis } = await supabaseClient
      .from('pending_analyses')
      .select('user_id')
      .eq('id', pendingAnalysisId)
      .single()

    if (pendingAnalysis) {
      await supabaseClient.from('user_notifications').insert({
        user_id: pendingAnalysis.user_id,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Analysis Complete`,
        message: `Your ${category} analysis has been completed and added to your dashboard.`,
        notification_type: 'analysis_complete',
        analysis_id: pendingAnalysisId
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing completed analysis:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processFoodAnalysis(supabaseClient: any, analysisResult: any, pendingAnalysisId: string) {
  const { data: pendingAnalysis } = await supabaseClient
    .from('pending_analyses')
    .select('user_id')
    .eq('id', pendingAnalysisId)
    .single()

  if (!pendingAnalysis) return

  // Extract meal type from various possible locations in the analysis result
  const mealType = analysisResult.meal_summary?.meal_type || 
                   analysisResult.meal_type || 
                   null

  // Create food entry with properly extracted meal_type
  const { data: foodEntry, error: foodError } = await supabaseClient
    .from('food_entries')
    .insert({
      user_id: pendingAnalysis.user_id,
      description: analysisResult.meal_description || 'AI-analyzed meal',
      meal_type: mealType, // Now properly extracting from JSON
      meal_date: analysisResult.meal_date || new Date().toISOString().split('T')[0],
      meal_time: analysisResult.meal_time,
      calories: analysisResult.nutrition?.total_calories,
      total_protein: analysisResult.nutrition?.total_protein,
      total_carbohydrates: analysisResult.nutrition?.total_carbohydrates,
      total_fats: analysisResult.nutrition?.total_fats,
      total_fiber: analysisResult.nutrition?.total_fiber,
      total_sodium: analysisResult.nutrition?.total_sodium,
      confidence_score: analysisResult.confidence_score,
      extracted_nutrients: analysisResult.nutrition || {},
      ingredients: analysisResult.ingredients || []
    })
    .select()
    .single()

  if (foodError) {
    console.error('Error creating food entry:', foodError)
    return
  }

  // Create individual food items if provided
  if (analysisResult.food_items && Array.isArray(analysisResult.food_items)) {
    for (const item of analysisResult.food_items) {
      await supabaseClient.from('food_items').insert({
        food_entry_id: foodEntry.id,
        name: item.name,
        calories: item.calories,
        proteins: item.proteins,
        carbohydrates: item.carbohydrates,
        fats: item.fats,
        fiber: item.fiber,
        sodium: item.sodium,
        serving_size: item.serving_size,
        is_vegetarian: item.is_vegetarian,
        is_vegan: item.is_vegan,
        contains_allergens: item.contains_allergens
      })
    }
  }

  // Create health assessment if provided
  if (analysisResult.health_assessment) {
    await supabaseClient.from('health_assessments').insert({
      food_entry_id: foodEntry.id,
      diabetes_rating: analysisResult.health_assessment.diabetes_rating,
      diabetes_suggestion: analysisResult.health_assessment.diabetes_suggestion,
      hypertension_rating: analysisResult.health_assessment.hypertension_rating,
      hypertension_suggestion: analysisResult.health_assessment.hypertension_suggestion,
      general_suggestion: analysisResult.health_assessment.general_suggestion,
      nutrients_high: analysisResult.health_assessment.nutrients_high,
      nutrients_low: analysisResult.health_assessment.nutrients_low
    })
  }
}

async function processReceiptAnalysis(supabaseClient: any, analysisResult: any, pendingAnalysisId: string) {
  const { data: pendingAnalysis } = await supabaseClient
    .from('pending_analyses')
    .select('user_id, image_url')
    .eq('id', pendingAnalysisId)
    .single()

  if (!pendingAnalysis) return

  // Create receipt entry
  const { data: receipt, error: receiptError } = await supabaseClient
    .from('receipts')
    .insert({
      user_id: pendingAnalysis.user_id,
      image_url: pendingAnalysis.image_url,
      vendor: analysisResult.merchant?.store_name,
      store_address: analysisResult.merchant?.store_address,
      city: analysisResult.merchant?.city,
      state: analysisResult.merchant?.state,
      postal_code: analysisResult.merchant?.postal_code,
      country: analysisResult.merchant?.country,
      receipt_date: analysisResult.transaction?.date,
      receipt_time: analysisResult.transaction?.time,
      receipt_id: analysisResult.transaction?.receipt_id,
      purchase_channel: analysisResult.transaction?.purchase_channel,
      subtotal: analysisResult.subtotal,
      tax_amount: analysisResult.tax_details?.[0]?.tax_amount,
      discount_amount: analysisResult.discount_details?.[0]?.discount_amount,
      total_amount: analysisResult.total,
      payment_method: analysisResult.payment?.method,
      card_last_digits: analysisResult.payment?.card_last_digits,
      transaction_id: analysisResult.payment?.transaction_id,
      currency: analysisResult.currency || 'USD',
      notes: analysisResult.notes,
      items: analysisResult.items || []
    })
    .select()
    .single()

  if (receiptError) {
    console.error('Error creating receipt:', receiptError)
    return
  }

  // Create individual receipt items
  if (analysisResult.items && Array.isArray(analysisResult.items)) {
    for (const item of analysisResult.items) {
      await supabaseClient.from('receipt_items').insert({
        receipt_id: receipt.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity || 1,
        category: item.category,
        subcategory: item.subcategory,
        sku: item.sku,
        discount: item.discount || 0
      })
    }
  }
}

async function processWorkoutAnalysis(supabaseClient: any, analysisResult: any, pendingAnalysisId: string) {
  const { data: pendingAnalysis } = await supabaseClient
    .from('pending_analyses')
    .select('user_id, image_url')
    .eq('id', pendingAnalysisId)
    .single()

  if (!pendingAnalysis) return

  // Create workout entry
  const { data: workout, error: workoutError } = await supabaseClient
    .from('workouts')
    .insert({
      user_id: pendingAnalysis.user_id,
      image_url: pendingAnalysis.image_url,
      workout_type: analysisResult.workout_type,
      description: analysisResult.description,
      duration: analysisResult.duration_minutes,
      calories_burned: analysisResult.calories_burned,
      intensity_level: analysisResult.intensity_level,
      location: analysisResult.location,
      equipment_used: analysisResult.equipment_used || [],
      muscle_groups: analysisResult.muscle_groups || [],
      estimated_calories: analysisResult.estimated_calories || false,
      notes: JSON.stringify(analysisResult)
    })
    .select()
    .single()

  if (workoutError) {
    console.error('Error creating workout:', workoutError)
    return
  }

  // Create individual workout exercises
  if (analysisResult.exercises && Array.isArray(analysisResult.exercises)) {
    for (const exercise of analysisResult.exercises) {
      await supabaseClient.from('workout_exercises').insert({
        workout_id: workout.id,
        exercise_name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        duration_minutes: exercise.duration_seconds ? Math.round(exercise.duration_seconds / 60) : null,
        distance: exercise.distance_km,
        calories_burned: exercise.calories_burned
      })
    }
  }
}
