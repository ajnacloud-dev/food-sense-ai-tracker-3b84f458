
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    // Try to find JSON-like content - improved regex
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        // Try to fix common JSON issues
        const fixedJson = jsonStr
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/\n/g, ' ')     // Remove newlines that might break JSON
          .replace(/\t/g, ' ');    // Remove tabs
        return JSON.parse(fixedJson);
      } catch (e) {
        console.error('Failed to parse and fix substring JSON:', e);
      }
    }
    
    throw new Error(`Invalid JSON response in ${context}: ${text.substring(0, 200)}...`);
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
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

class LangGraphWorkflow {
  private supabaseClient: any;
  private openaiApiKey: string;
  private state: any = {};
  private totalTokens: number = 0;
  private totalCost: number = 0;

  constructor(supabaseClient: any, openaiApiKey: string) {
    this.supabaseClient = supabaseClient;
    this.openaiApiKey = openaiApiKey;
  }

  async executeWorkflow(description: string, imageUrl: string | null, workflowConfig: any): Promise<any> {
    console.log('Starting LangGraph workflow with node: classify');
    
    this.state = {
      description,
      imageUrl,
      workflowConfig: workflowConfig || {},
      uploadTime: new Date().toISOString()
    };

    try {
      // Execute nodes in sequence
      await this.executeNode('classify', this.executeClassifier.bind(this));
      await this.executeNode('analyze', this.executeAnalyzer.bind(this));
      await this.executeNode('enrich', this.executeEnricher.bind(this));
      await this.executeNode('validate', this.executeValidator.bind(this));

      return {
        success: true,
        result: {
          classification: this.state.classification,
          analysis: this.state.analysis,
          enrichment: this.state.enrichment,
          validation: this.state.validation
        },
        metadata: {
          totalTokens: this.totalTokens,
          totalCost: this.totalCost
        }
      };
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  async executeNode(nodeName: string, nodeFunction: Function): Promise<void> {
    console.log(`Executing node: ${nodeName} (${nodeFunction.name.replace('execute', '').toLowerCase()})`);
    try {
      await nodeFunction();
    } catch (error) {
      console.error(`Error in node ${nodeName}:`, error);
      throw error;
    }
  }

  async executeClassifier(): Promise<void> {
    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const prompt = `You are an AI classifier that determines the category of content based on images and descriptions.

Analyze the provided content and classify it into one of these categories:
- food: Any food items, meals, beverages, nutrition-related content, cooking, restaurants, recipes
- receipt: Shopping receipts, bills, invoices, purchase documents, store receipts, payment confirmations
- workout: Exercise activities, fitness routines, sports, physical activities, gym equipment, athletic activities

Current time: ${currentTime}

Input:
${this.state.description ? `Description: ${this.state.description}` : 'No description provided'}
${this.state.imageUrl ? 'An image is provided for analysis.' : 'No image provided'}

IMPORTANT: Carefully analyze the content. Look for visual cues like:
- Food: plates, utensils, beverages, ingredients, restaurant settings, cooking equipment
- Receipt: printed text, store logos, itemized lists, prices, payment methods, barcodes
- Workout: exercise equipment, gyms, sports fields, athletic wear, people exercising

Return ONLY a valid JSON object with this exact format (no markdown, no code blocks):
{
  "category": "food",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification based on visual and textual analysis"
}`;

    const messages = [
      { role: 'system', content: 'You are a precise content classifier. Always respond with valid JSON only, no markdown formatting.' },
      { role: 'user', content: prompt }
    ];

    // Add image if provided
    if (this.state.imageUrl) {
      try {
        const base64Image = await imageUrlToBase64(this.state.imageUrl);
        messages[1].content = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image, continuing without it:', error);
      }
    }

    const response = await this.callOpenAI(messages, 'gpt-4o', 300);
    this.state.classification = safeJsonParse(response.content, 'classification');
  }

  async executeAnalyzer(): Promise<void> {
    const { data: prompt } = await this.supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', this.state.classification.category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${this.state.classification.category}`);
    }

    // Get current time info for meal type determination
    const now = new Date();
    const hour = now.getHours();
    const timeContext = `
Current time: ${now.toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})}
Hour (24h format): ${hour}
Upload time: ${this.state.uploadTime}`;

    let enhancedUserPrompt = prompt.user_prompt_template.replace('{description}', this.state.description || 'No description provided');
    
    // Add time context for food analysis
    if (this.state.classification.category === 'food') {
      enhancedUserPrompt += `

${timeContext}

IMPORTANT: 
1. Analyze the ACTUAL food items visible in the image. Be specific about what you see.
2. Determine meal type based on the current time:
   - 5-10 AM: breakfast
   - 10 AM-2 PM: lunch  
   - 2-5 PM: snack
   - 5-10 PM: dinner
   - 10 PM-5 AM: late night snack
3. Provide detailed descriptions of the visible food items, not generic responses.
4. Base nutritional estimates on the actual portion sizes and food types you can see.
5. If you can see specific dishes, name them accurately.`;
    }

    const analysisPrompt = `${enhancedUserPrompt}

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks). The response must be parseable JSON with complete analysis.`;
    
    const messages = [
      { role: 'system', content: `${prompt.system_prompt}\n\nALWAYS respond with valid JSON only, no markdown formatting.` },
      { role: 'user', content: analysisPrompt }
    ];

    // Add image if provided
    if (this.state.imageUrl) {
      try {
        const base64Image = await imageUrlToBase64(this.state.imageUrl);
        messages[1].content = [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image, continuing without it:', error);
      }
    }

    const response = await this.callOpenAI(messages, 'gpt-4o', 1500);
    this.state.analysis = safeJsonParse(response.content, 'analysis');
  }

  async executeEnricher(): Promise<void> {
    // For now, enricher just copies the analysis
    // In the future, this could add additional data from external APIs
    this.state.enrichment = { ...this.state.analysis };
  }

  async executeValidator(): Promise<void> {
    // Simplified validator that just ensures we have valid data
    const analysis = this.state.analysis || this.state.enrichment;
    
    if (!analysis) {
      throw new Error('No analysis data available for validation');
    }

    this.state.validation = {
      cleanedData: analysis
    };
  }

  private async callOpenAI(messages: any[], model: string, maxTokens: number): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Track usage
    if (data.usage) {
      this.totalTokens += data.usage.total_tokens;
      const pricing = model === 'gpt-4o' ? { input: 0.0025, output: 0.01 } : { input: 0.00015, output: 0.0006 };
      this.totalCost += (data.usage.prompt_tokens / 1000 * pricing.input) + (data.usage.completion_tokens / 1000 * pricing.output);
    }

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { description, imageUrl, workflowConfig } = await req.json();
    
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

    console.log(`Starting LangGraph workflow for user ${user.id}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const workflow = new LangGraphWorkflow(supabaseClient, openaiApiKey);
    const result = await workflow.executeWorkflow(description, imageUrl, workflowConfig);

    const processingTime = Date.now() - startTime;

    // Log API usage and cost
    if (result.metadata?.totalTokens > 0) {
      await supabaseClient
        .from('api_costs')
        .insert({
          user_id: user.id,
          function_name: 'langgraph-workflow',
          prompt_tokens: Math.floor(result.metadata.totalTokens * 0.7),
          completion_tokens: Math.floor(result.metadata.totalTokens * 0.3),
          total_tokens: result.metadata.totalTokens,
          cost_usd: result.metadata.totalCost,
          model_used: 'gpt-4o',
          category: result.result.classification?.category || 'unknown'
        });
    }

    console.log(`Workflow completed in ${processingTime}ms`);
    console.log(`LangGraph workflow completed. Category: ${result.result.classification?.category}, Tokens: ${result.metadata?.totalTokens || 0}, Cost: $${(result.metadata?.totalCost || 0).toFixed(6)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in LangGraph workflow function:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
