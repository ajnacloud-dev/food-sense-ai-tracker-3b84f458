
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
    const { description, imageUrl, category } = await req.json();
    
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

    console.log(`Starting analysis for user ${user.id}, category: ${category}`);

    // Get the appropriate prompt for the category
    const { data: prompt } = await supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

    // Prepare messages for OpenAI
    const userPrompt = prompt.user_prompt_template.replace('{description}', description || 'No description provided');
    
    const messages = [
      { role: 'system', content: prompt.system_prompt },
      { role: 'user', content: userPrompt }
    ];

    // Add image to the message if provided
    if (imageUrl) {
      messages[1].content = [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ];
    }

    console.log('Calling OpenAI API...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl ? 'gpt-4o' : 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const analysis = data.choices[0].message.content;
    
    console.log('OpenAI analysis received:', analysis.substring(0, 100) + '...');

    // Parse the JSON response
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', analysis);
      throw new Error('Invalid response format from AI');
    }

    // Calculate cost (approximate pricing)
    const modelUsed = imageUrl ? 'gpt-4o' : 'gpt-4o-mini';
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    const totalTokens = data.usage?.total_tokens || 0;
    
    // Pricing per 1k tokens (approximate)
    const pricing = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.0025, output: 0.01 }
    };
    
    const cost = (promptTokens / 1000 * pricing[modelUsed].input) + 
                 (completionTokens / 1000 * pricing[modelUsed].output);

    // Log API usage and cost
    await supabaseClient
      .from('api_costs')
      .insert({
        user_id: user.id,
        function_name: 'analyze-content',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost_usd: cost,
        model_used: modelUsed,
        category: category
      });

    console.log(`Analysis completed. Cost: $${cost.toFixed(6)}`);

    return new Response(JSON.stringify({ 
      analysis: parsedAnalysis,
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
    console.error("Error in analyze-content function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
