import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LangSmith tracing configuration
const LANGCHAIN_API_KEY = Deno.env.get('LANGCHAIN_API_KEY');
const LANGCHAIN_PROJECT = Deno.env.get('LANGSMITH_PROJECT') || 'nutriwealth';
const LANGCHAIN_ENDPOINT = Deno.env.get('LANGSMITH_ENDPOINT') || 'https://api.smith.langchain.com';
const LANGSMITH_TRACING = Deno.env.get('LANGSMITH_TRACING') === 'true';

// LangSmith trace helper
async function createLangSmithTrace(name: string, inputs: any, sessionId?: string) {
  if (!LANGCHAIN_API_KEY || !LANGSMITH_TRACING) return null;
  
  try {
    const response = await fetch(`${LANGCHAIN_ENDPOINT}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGCHAIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        run_type: 'chain',
        inputs,
        session_name: sessionId || 'default',
        project_name: LANGCHAIN_PROJECT,
        start_time: new Date().toISOString(),
      }),
    });
    
    if (response.ok) {
      const trace = await response.json();
      return trace.id;
    }
  } catch (error) {
    console.error('Failed to create LangSmith trace:', error);
  }
  return null;
}

// Update LangSmith trace
async function updateLangSmithTrace(traceId: string, outputs: any, error?: string) {
  if (!LANGCHAIN_API_KEY || !traceId || !LANGSMITH_TRACING) return;
  
  try {
    await fetch(`${LANGCHAIN_ENDPOINT}/runs/${traceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${LANGCHAIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outputs,
        error: error ? { message: error } : undefined,
        end_time: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to update LangSmith trace:', err);
  }
}

// Utility function to convert image URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`Converting image to base64: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const base64 = btoa(binary);
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Utility function to log processing status
async function logProcessingStatus(
  supabaseClient: any, 
  userId: string, 
  imageUrl: string | null, 
  status: string, 
  method: string, 
  errorMessage?: string
) {
  try {
    await supabaseClient
      .from('image_processing_log')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        processing_status: status,
        processing_method: method,
        error_message: errorMessage,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('Failed to log processing status:', error);
  }
}

// Safe JSON parser with better error handling
function safeJsonParse(text: string, context: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`Failed to parse JSON in ${context}:`, text);
    console.error('Parse error:', error);
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse extracted JSON:', e);
      }
    }
    
    // Try to find JSON-like content
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      } catch (e) {
        console.error('Failed to parse substring JSON:', e);
      }
    }
    
    throw new Error(`Invalid JSON response in ${context}: ${text.substring(0, 200)}...`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let traceId: string | null = null;

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

    // Create LangSmith trace
    traceId = await createLangSmithTrace('auto-classify-and-analyze', {
      description: description ? 'provided' : 'none',
      imageUrl: imageUrl ? 'provided' : 'none',
      userId: user.id
    }, user.id);

    console.log(`Starting auto-classification for user ${user.id} at ${new Date().toISOString()}`);
    console.log(`Input - Description: ${description ? 'provided' : 'none'}, Image: ${imageUrl ? 'provided' : 'none'}`);

    // Log start of processing
    await logProcessingStatus(supabaseClient, user.id, imageUrl, 'pending', imageUrl ? 'url' : 'text_only');

    // Step 1: Classification prompt
    const classificationPrompt = `You are an AI classifier that determines the category of content based on images and descriptions.

Analyze the provided content and classify it into one of these categories:
- food: Any food items, meals, beverages, nutrition-related content
- receipt: Shopping receipts, bills, invoices, purchase documents
- workout: Exercise activities, fitness routines, sports, physical activities

Input:
${description ? `Description: ${description}` : 'No description provided'}
${imageUrl ? 'An image is provided for analysis.' : 'No image provided'}

IMPORTANT: Return ONLY a valid JSON object with this exact format (no markdown, no code blocks):
{
  "category": "food",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification"
}`;

    // Prepare classification messages
    const classificationMessages = [
      { role: 'system', content: 'You are a precise content classifier. Always respond with valid JSON only, no markdown formatting.' },
      { role: 'user', content: classificationPrompt }
    ];

    // Add image to classification if provided - try URL first, fallback to base64
    let imageProcessingMethod = 'text_only';
    if (imageUrl) {
      try {
        console.log('Step 1a: Attempting to use image URL directly...');
        classificationMessages[1].content = [
          { type: 'text', text: classificationPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ];
        imageProcessingMethod = 'url';
      } catch (urlError) {
        console.log('Step 1b: URL failed, converting to base64...');
        try {
          const base64Image = await imageUrlToBase64(imageUrl);
          classificationMessages[1].content = [
            { type: 'text', text: classificationPrompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ];
          imageProcessingMethod = 'base64';
        } catch (base64Error) {
          console.error('Both URL and base64 methods failed:', base64Error);
          imageProcessingMethod = 'failed';
          // Continue without image
        }
      }
    }

    console.log(`Step 1: Calling OpenAI for classification using method: ${imageProcessingMethod}...`);

    // Get classification
    const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl && imageProcessingMethod !== 'failed' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: classificationMessages,
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!classificationResponse.ok) {
      const errorText = await classificationResponse.text();
      console.error('Classification API error:', errorText);
      throw new Error(`Classification API error: ${classificationResponse.status} - ${errorText}`);
    }

    const classificationData = await classificationResponse.json();
    const classificationContent = classificationData.choices[0].message.content;
    console.log('Raw classification response:', classificationContent);
    
    const classificationResult = safeJsonParse(classificationContent, 'classification');
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
    
    const analysisPrompt = `${userPrompt}

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks). The response must be parseable JSON.`;
    
    const analysisMessages = [
      { role: 'system', content: `${prompt.system_prompt}\n\nALWAYS respond with valid JSON only, no markdown formatting.` },
      { role: 'user', content: analysisPrompt }
    ];

    // Add image to analysis if provided using the same method that worked for classification
    if (imageUrl && imageProcessingMethod !== 'failed') {
      if (imageProcessingMethod === 'url') {
        analysisMessages[1].content = [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ];
      } else if (imageProcessingMethod === 'base64') {
        const base64Image = await imageUrlToBase64(imageUrl);
        analysisMessages[1].content = [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      }
    }

    console.log('Step 2: Calling OpenAI for detailed analysis...');

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl && imageProcessingMethod !== 'failed' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: analysisMessages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis API error:', errorText);
      throw new Error(`Analysis API error: ${analysisResponse.status} - ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices[0].message.content;
    console.log('Raw analysis response:', analysisContent);
    
    const parsedAnalysis = safeJsonParse(analysisContent, 'analysis');
    
    console.log('Analysis completed');

    // Calculate total cost
    const modelUsed = imageUrl && imageProcessingMethod !== 'failed' ? 'gpt-4o' : 'gpt-4o-mini';
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

    const processingTime = Date.now() - startTime;

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

    // Log successful completion
    await logProcessingStatus(supabaseClient, user.id, imageUrl, 'completed', imageProcessingMethod);

    const result = {
      category: category,
      analysis: parsedAnalysis,
      classification: classificationResult,
      metadata: {
        model: modelUsed,
        tokens: totalTokens,
        cost: cost,
        processingTime: processingTime,
        imageProcessingMethod: imageProcessingMethod
      }
    };

    // Update LangSmith trace with success
    if (traceId) {
      await updateLangSmithTrace(traceId, result);
    }

    console.log(`Auto-classification and analysis completed. Category: ${category}, Cost: $${cost.toFixed(6)}, Time: ${processingTime}ms, Method: ${imageProcessingMethod}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in auto-classify-and-analyze function:", error);
    
    // Update LangSmith trace with error
    if (traceId) {
      await updateLangSmithTrace(traceId, {}, error.message);
    }
    
    // Log error if we have user context
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (user) {
          await logProcessingStatus(supabaseClient, user.id, null, 'failed', 'unknown', error.message);
        }
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
