
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log(`Starting auto-classification for user ${user.id}`);

    // Step 1: Classification prompt
    const classificationPrompt = `You are an AI classifier that determines the category of content based on images and descriptions.

Analyze the provided content and classify it into one of these categories:
- food: Any food items, meals, beverages, nutrition-related content
- receipt: Shopping receipts, bills, invoices, purchase documents
- workout: Exercise activities, fitness routines, sports, physical activities

Input:
${description ? `Description: ${description}` : 'No description provided'}
${imageUrl ? 'An image is provided for analysis.' : 'No image provided'}

Return ONLY a JSON object with this format:
{
  "category": "food|receipt|workout",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification"
}`;

    // Prepare classification messages
    const classificationMessages = [
      { role: 'system', content: 'You are a precise content classifier. Always respond with valid JSON only.' },
      { role: 'user', content: classificationPrompt }
    ];

    // Add image to classification if provided
    if (imageUrl) {
      classificationMessages[1].content = [
        { type: 'text', text: classificationPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ];
    }

    console.log('Step 1: Calling OpenAI for classification...');

    // Get classification
    const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl ? 'gpt-4o' : 'gpt-4o-mini',
        messages: classificationMessages,
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!classificationResponse.ok) {
      throw new Error(`Classification API error: ${classificationResponse.status}`);
    }

    const classificationData = await classificationResponse.json();
    const classificationResult = JSON.parse(classificationData.choices[0].message.content);
    const category = classificationResult.category;

    console.log(`Classification result: ${category} (confidence: ${classificationResult.confidence})`);

    // Step 2: Get category-specific prompt
    const { data: prompt } = await supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

    // Step 3: Detailed analysis using category-specific prompt
    const userPrompt = prompt.user_prompt_template.replace('{description}', description || 'No description provided');
    
    const analysisMessages = [
      { role: 'system', content: prompt.system_prompt },
      { role: 'user', content: userPrompt }
    ];

    // Add image to analysis if provided
    if (imageUrl) {
      analysisMessages[1].content = [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ];
    }

    console.log('Step 2: Calling OpenAI for detailed analysis...');

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl ? 'gpt-4o' : 'gpt-4o-mini',
        messages: analysisMessages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisResult = analysisData.choices[0].message.content;
    
    console.log('Analysis completed');

    // Parse the analysis JSON response
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisResult);
    } catch (e) {
      console.error('Failed to parse analysis response as JSON:', analysisResult);
      throw new Error('Invalid response format from AI analysis');
    }

    // Calculate total cost
    const modelUsed = imageUrl ? 'gpt-4o' : 'gpt-4o-mini';
    const totalPromptTokens = (classificationData.usage?.prompt_tokens || 0) + (analysisData.usage?.prompt_tokens || 0);
    const totalCompletionTokens = (classificationData.usage?.completion_tokens || 0) + (analysisData.usage?.completion_tokens || 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    
    // Pricing per 1k tokens
    const pricing = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.0025, output: 0.01 }
    };
    
    const cost = (totalPromptTokens / 1000 * pricing[modelUsed].input) + 
                 (totalCompletionTokens / 1000 * pricing[modelUsed].output);

    // Log API usage and cost
    await supabaseClient
      .from('api_costs')
      .insert({
        user_id: user.id,
        function_name: 'auto-classify-and-analyze',
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalTokens,
        cost_usd: cost,
        model_used: modelUsed,
        category: category
      });

    console.log(`Auto-classification and analysis completed. Category: ${category}, Cost: $${cost.toFixed(6)}`);

    return new Response(JSON.stringify({ 
      category: category,
      analysis: parsedAnalysis,
      classification: classificationResult,
      metadata: {
        model: modelUsed,
        tokens: totalTokens,
        cost: cost
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in auto-classify-and-analyze function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
