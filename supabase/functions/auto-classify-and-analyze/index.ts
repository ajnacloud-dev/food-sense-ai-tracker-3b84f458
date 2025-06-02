
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, imageUrl } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use LLM_MODEL_TO_USE secret with fallback
    const configuredModel = Deno.env.get('LLM_MODEL_TO_USE') || 'gpt-4o-mini';
    const model = ['gpt-4o', 'gpt-4o-mini'].includes(configuredModel) ? configuredModel : 'gpt-4o-mini';
    
    console.log(`Using model: ${model} for auto-classify-and-analyze`);

    // Quick classification with conservative prompting
    const classificationPrompt = `Classify this content into: food, receipt, or workout.
${description ? `Description: ${description}` : ''}
CRITICAL: Only classify based on what is explicitly visible or described.
Return only: {"category": "food|receipt|workout", "confidence": 0.95}`;

    let classificationMessages = [
      { role: 'system', content: 'You are a precise content classifier. Return only JSON. Never assume or add information not explicitly provided.' },
      { role: 'user', content: classificationPrompt }
    ];

    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        classificationMessages[1].content = [
          { type: 'text', text: classificationPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
        ];
      } catch (error) {
        console.error('Failed to process image:', error);
      }
    }

    // Classification API call with temperature 0
    const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: classificationMessages,
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!classificationResponse.ok) {
      throw new Error(`Classification failed: ${classificationResponse.status}`);
    }

    const classificationData = await classificationResponse.json();
    const classificationResult = JSON.parse(classificationData.choices[0].message.content);
    const category = classificationResult.category;

    console.log(`Classified as: ${category}`);

    // Get category-specific prompt
    const { data: prompt } = await supabase
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

    // Get current time and determine meal type based on time
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentHour = now.getHours();
    
    // Determine meal type based on current time
    let mealType = 'snack';
    if (currentHour >= 5 && currentHour < 11) {
      mealType = 'breakfast';
    } else if (currentHour >= 11 && currentHour < 15) {
      mealType = 'lunch';
    } else if (currentHour >= 17 && currentHour < 22) {
      mealType = 'dinner';
    }

    const timeContext = `Current time: ${now.toLocaleString()}, Current hour: ${currentHour}, Suggested meal type based on time: ${mealType}`;
    
    // Enhanced analysis prompt with strict instructions
    let analysisPrompt = prompt.user_prompt_template.replace('{description}', description || 'No description provided');
    
    if (category === 'food') {
      analysisPrompt += `\n\n${timeContext}\nIMPORTANT: Use the current time context to determine the appropriate meal type. Based on the current hour (${currentHour}), this should likely be classified as "${mealType}". Please provide detailed nutrition analysis and use the time-appropriate meal type.`;
    } else if (category === 'receipt') {
      analysisPrompt += `
      
CRITICAL RECEIPT ANALYSIS INSTRUCTIONS:
• Extract ONLY items that are clearly visible and readable
• NEVER add items that are not explicitly shown
• NEVER enrich item names with generic descriptions
• If text is unclear or illegible, skip that item entirely
• Double-check that each item name matches exactly what is written
• Verify prices and quantities against what is visible
• Be conservative - better to miss an item than add a wrong one
• ONLY process what is available and clearly readable`;
    } else if (category === 'workout') {
      analysisPrompt += `\n${timeContext}\nIdentify exercises, sets, reps, and estimate calories burned.`;
    }

    analysisPrompt += '\nReturn ONLY valid JSON (no markdown blocks).';

    let analysisMessages = [
      { role: 'system', content: `${prompt.system_prompt}\nAlways respond with valid JSON only. NEVER hallucinate or add information not explicitly visible. For food analysis, use the provided time context to determine appropriate meal type.` },
      { role: 'user', content: analysisPrompt }
    ];

    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        analysisMessages[1].content = [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
        ];
      } catch (error) {
        console.error('Failed to process image for analysis:', error);
      }
    }

    // Analysis API call with temperature 0
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: analysisMessages,
        temperature: 0,
        max_tokens: 1500,
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisResult;
    
    try {
      analysisResult = JSON.parse(analysisData.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse analysis JSON:', analysisData.choices[0].message.content);
      throw new Error('Invalid analysis response format');
    }

    // Log API usage
    const totalTokens = (classificationData.usage?.total_tokens || 0) + (analysisData.usage?.total_tokens || 0);
    if (totalTokens > 0) {
      const pricing = model === 'gpt-4o' ? { input: 0.0025, output: 0.01 } : { input: 0.00015, output: 0.0006 };
      const totalCost = (totalTokens * 0.7 / 1000 * pricing.input) + (totalTokens * 0.3 / 1000 * pricing.output);
      
      await supabase
        .from('api_costs')
        .insert({
          user_id: user.id,
          function_name: 'auto-classify-and-analyze-optimized',
          prompt_tokens: Math.floor(totalTokens * 0.7),
          completion_tokens: Math.floor(totalTokens * 0.3),
          total_tokens: totalTokens,
          cost_usd: totalCost,
          model_used: model,
          category: category
        });
    }

    return new Response(JSON.stringify({
      success: true,
      classification: classificationResult,
      analysis: analysisResult,
      metadata: {
        model_used: model,
        total_tokens: totalTokens,
        temperature_used: 0,
        time_context: timeContext,
        suggested_meal_type: category === 'food' ? mealType : null
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in optimized auto-classify-and-analyze:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
