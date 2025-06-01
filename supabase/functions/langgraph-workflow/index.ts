
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LangSmith configuration
interface LangSmithConfig {
  apiKey: string;
  endpoint: string;
  project: string;
  enabled: boolean;
}

// Initialize LangSmith configuration
function initLangSmith(): LangSmithConfig {
  const enabled = Deno.env.get('LANGSMITH_TRACING') === 'true';
  return {
    apiKey: Deno.env.get('LANGSMITH_API_KEY') || '',
    endpoint: Deno.env.get('LANGSMITH_ENDPOINT') || 'https://api.smith.langchain.com',
    project: Deno.env.get('LANGSMITH_PROJECT') || 'food-sense-ai',
    enabled
  };
}

// LangSmith trace utilities
class LangSmithTracer {
  private config: LangSmithConfig;
  private sessionId: string;

  constructor() {
    this.config = initLangSmith();
    this.sessionId = crypto.randomUUID();
  }

  async startTrace(name: string, inputs: any, metadata: any = {}) {
    if (!this.config.enabled || !this.config.apiKey) return null;

    const traceData = {
      id: crypto.randomUUID(),
      name,
      start_time: new Date().toISOString(),
      inputs,
      session_id: this.sessionId,
      extra: {
        metadata,
        version: "1.0.0"
      }
    };

    try {
      await fetch(`${this.config.endpoint}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        body: JSON.stringify(traceData)
      });

      return traceData.id;
    } catch (error) {
      console.error('LangSmith trace start failed:', error);
      return null;
    }
  }

  async endTrace(traceId: string | null, outputs: any, error: any = null) {
    if (!this.config.enabled || !this.config.apiKey || !traceId) return;

    const updateData = {
      end_time: new Date().toISOString(),
      outputs,
      error: error ? { message: error.message, type: error.constructor.name } : null
    };

    try {
      await fetch(`${this.config.endpoint}/runs/${traceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('LangSmith trace end failed:', error);
    }
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

// Enhanced error handling for OpenAI API calls
function handleOpenAIError(error: any): { isQuotaError: boolean, userMessage: string, shouldFallback: boolean } {
  console.error('OpenAI API Error:', error);
  
  if (error.message?.includes('insufficient_quota') || error.message?.includes('quota')) {
    return {
      isQuotaError: true,
      userMessage: 'AI analysis is temporarily unavailable due to usage limits. Please try again later or contact support.',
      shouldFallback: true
    };
  }
  
  if (error.message?.includes('rate_limit')) {
    return {
      isQuotaError: false,
      userMessage: 'AI service is busy. Please try again in a moment.',
      shouldFallback: true
    };
  }
  
  return {
    isQuotaError: false,
    userMessage: 'AI analysis failed. Please try again.',
    shouldFallback: false
  };
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

// Test data for edge function testing
const TEST_DATA = {
  food: {
    description: "Grilled chicken salad with vegetables",
    imageUrl: null
  },
  receipt: {
    description: "Grocery store receipt",
    imageUrl: null
  },
  workout: {
    description: "30 minute morning run",
    imageUrl: null
  }
};

class LangGraphWorkflow {
  private supabaseClient: any;
  private openaiApiKey: string;
  private state: any = {};
  private totalTokens: number = 0;
  private totalCost: number = 0;
  private tracer: LangSmithTracer;
  private debugMode: boolean = false;

  constructor(supabaseClient: any, openaiApiKey: string, debugMode: boolean = false) {
    this.supabaseClient = supabaseClient;
    this.openaiApiKey = openaiApiKey;
    this.tracer = new LangSmithTracer();
    this.debugMode = debugMode;
  }

  async executeWorkflow(description: string, imageUrl: string | null, workflowConfig: any): Promise<any> {
    const workflowStartTime = Date.now();
    console.log('Starting LangGraph workflow with node: classify');
    
    // Start main workflow trace
    const mainTraceId = await this.tracer.startTrace('langgraph_workflow', {
      description,
      hasImage: !!imageUrl,
      workflowConfig
    }, {
      user_input: description,
      image_provided: !!imageUrl,
      timestamp: new Date().toISOString()
    });
    
    this.state = {
      description,
      imageUrl,
      workflowConfig: workflowConfig || {},
      uploadTime: new Date().toISOString(),
      debugMode: this.debugMode
    };

    try {
      // Execute nodes in sequence with error handling
      await this.executeNode('classify', this.executeClassifier.bind(this));
      await this.executeNode('analyze', this.executeAnalyzer.bind(this));
      await this.executeNode('enrich', this.executeEnricher.bind(this));
      await this.executeNode('validate', this.executeValidator.bind(this));

      const result = {
        success: true,
        result: {
          classification: this.state.classification,
          analysis: this.state.analysis,
          enrichment: this.state.enrichment,
          validation: this.state.validation
        },
        metadata: {
          totalTokens: this.totalTokens,
          totalCost: this.totalCost,
          processingTime: Date.now() - workflowStartTime,
          langsmithTraceId: mainTraceId
        }
      };

      if (this.debugMode) {
        result.debug = {
          state: this.state,
          processingSteps: ['classify', 'analyze', 'enrich', 'validate']
        };
      }

      await this.tracer.endTrace(mainTraceId, result);
      return result;

    } catch (error) {
      console.error('Workflow execution failed:', error);
      await this.tracer.endTrace(mainTraceId, null, error);
      
      // Check if this is an OpenAI quota/rate limit error
      const errorInfo = handleOpenAIError(error);
      if (errorInfo.shouldFallback) {
        return {
          success: false,
          error: errorInfo.userMessage,
          errorType: errorInfo.isQuotaError ? 'quota_exceeded' : 'rate_limited',
          fallbackSuggestion: 'Please try uploading your content again later, or contact support if this issue persists.'
        };
      }
      
      throw error;
    }
  }

  async executeNode(nodeName: string, nodeFunction: Function): Promise<void> {
    const nodeStartTime = Date.now();
    console.log(`Executing node: ${nodeName} (${nodeFunction.name.replace('execute', '').toLowerCase()})`);
    
    const nodeTraceId = await this.tracer.startTrace(`node_${nodeName}`, {
      nodeName,
      state: this.debugMode ? this.state : { category: this.state.classification?.category }
    });

    try {
      await nodeFunction();
      const processingTime = Date.now() - nodeStartTime;
      console.log(`Node ${nodeName} completed in ${processingTime}ms`);
      
      await this.tracer.endTrace(nodeTraceId, {
        success: true,
        processingTime,
        output: this.state[nodeName === 'classify' ? 'classification' : nodeName === 'analyze' ? 'analysis' : nodeName]
      });
    } catch (error) {
      console.error(`Error in node ${nodeName}:`, error);
      await this.tracer.endTrace(nodeTraceId, null, error);
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

    const response = await this.callOpenAI(messages, 'gpt-4o', 300, 'classification');
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

    // Enhanced receipt analysis instructions
    if (this.state.classification.category === 'receipt') {
      enhancedUserPrompt += `

CRITICAL RECEIPT ANALYSIS INSTRUCTIONS:
1. CAREFULLY read ALL numbers on the receipt - look for subtotals, taxes, discounts, and final total
2. The "total" field should be the FINAL amount paid (usually the largest number at the bottom)
3. Double-check your math: subtotal + tax - discounts = total
4. If you see multiple totals, use the FINAL total amount (often labeled as "TOTAL", "AMOUNT DUE", or "BALANCE")
5. Be extremely careful with decimal placement - 12.98 is NOT the same as 6.48
6. Look for terms like: TOTAL, AMOUNT DUE, BALANCE DUE, GRAND TOTAL, FINAL TOTAL
7. VERIFY your total against the visible receipt image before finalizing

VALIDATION STEP: Before returning your response, verify that the total amount makes sense given the items and their prices.`;
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

    const response = await this.callOpenAI(messages, 'gpt-4o', 1500, 'analysis');
    this.state.analysis = safeJsonParse(response.content, 'analysis');

    // Validation for receipt totals
    if (this.state.classification.category === 'receipt' && this.state.analysis.total) {
      console.log(`Receipt analysis - Total detected: ${this.state.analysis.total}`);
      
      // Log validation information
      if (this.state.analysis.subtotal && this.state.analysis.tax_details) {
        const calculatedTotal = parseFloat(this.state.analysis.subtotal) + 
          (this.state.analysis.tax_details.reduce((sum: number, tax: any) => sum + parseFloat(tax.tax_amount || 0), 0));
        console.log(`Receipt validation - Calculated total: ${calculatedTotal.toFixed(2)}, Detected total: ${this.state.analysis.total}`);
      }
    }
  }

  async executeEnricher(): Promise<void> {
    // For now, enricher just copies the analysis
    // In the future, this could add additional data from external APIs
    this.state.enrichment = { ...this.state.analysis };
  }

  async executeValidator(): Promise<void> {
    // Enhanced validator with better validation logic
    const analysis = this.state.analysis || this.state.enrichment;
    
    if (!analysis) {
      throw new Error('No analysis data available for validation');
    }

    // Validation specific to category
    let validationResults = { isValid: true, warnings: [], errors: [] };

    if (this.state.classification.category === 'receipt') {
      // Receipt-specific validation
      if (!analysis.total || analysis.total <= 0) {
        validationResults.errors.push('Missing or invalid total amount');
        validationResults.isValid = false;
      }

      if (analysis.items && Array.isArray(analysis.items)) {
        const itemsTotal = analysis.items.reduce((sum: number, item: any) => 
          sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        
        if (Math.abs(itemsTotal - parseFloat(analysis.subtotal || 0)) > 0.02) {
          validationResults.warnings.push(`Items total (${itemsTotal.toFixed(2)}) doesn't match subtotal (${analysis.subtotal})`);
        }
      }
    }

    this.state.validation = {
      cleanedData: analysis,
      validation: validationResults
    };
  }

  private async callOpenAI(messages: any[], model: string, maxTokens: number, operationType: string = 'unknown'): Promise<any> {
    const callStartTime = Date.now();
    const traceId = await this.tracer.startTrace(`openai_${operationType}`, {
      model,
      maxTokens,
      messageCount: messages.length,
      hasImage: messages.some(m => Array.isArray(m.content))
    });

    try {
      console.log(`OpenAI API call for ${operationType} - Model: ${model}, Max tokens: ${maxTokens}`);
      
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
        console.error('OpenAI API error response:', errorText);
        
        // Parse error response to get specific error type
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.code === 'insufficient_quota') {
            throw new Error('insufficient_quota: OpenAI API quota exceeded');
          }
          if (errorData.error?.code === 'rate_limit_exceeded') {
            throw new Error('rate_limit: OpenAI API rate limit exceeded');
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - callStartTime;
      
      // Track usage
      if (data.usage) {
        this.totalTokens += data.usage.total_tokens;
        const pricing = model === 'gpt-4o' ? { input: 0.0025, output: 0.01 } : { input: 0.00015, output: 0.0006 };
        this.totalCost += (data.usage.prompt_tokens / 1000 * pricing.input) + (data.usage.completion_tokens / 1000 * pricing.output);
        
        console.log(`OpenAI usage for ${operationType}: ${data.usage.total_tokens} tokens, $${((data.usage.prompt_tokens / 1000 * pricing.input) + (data.usage.completion_tokens / 1000 * pricing.output)).toFixed(6)}`);
      }

      const result = {
        content: data.choices[0].message.content,
        usage: data.usage,
        processingTime
      };

      await this.tracer.endTrace(traceId, {
        response: this.debugMode ? result : { usage: data.usage, processingTime },
        success: true
      });

      return result;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      await this.tracer.endTrace(traceId, null, error);
      throw error;
    }
  }
}

// Test endpoint for manual testing
function handleTestRequest(url: URL): Response {
  const category = url.searchParams.get('category') || 'food';
  const debug = url.searchParams.get('debug') === 'true';
  
  if (!TEST_DATA[category as keyof typeof TEST_DATA]) {
    return new Response(JSON.stringify({ 
      error: 'Invalid category. Use: food, receipt, or workout' 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const testData = TEST_DATA[category as keyof typeof TEST_DATA];
  
  const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>LangGraph Workflow Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .test-form { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .result { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .error { background: #ffebee; color: #c62828; }
            button { background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            textarea, input { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
        </style>
    </head>
    <body>
        <h1>LangGraph Workflow Test Interface</h1>
        <p>Test the workflow with different categories and inputs.</p>
        
        <div class="test-form">
            <h3>Test Workflow</h3>
            <form id="testForm">
                <label>Category:</label>
                <select id="category" name="category">
                    <option value="food" ${category === 'food' ? 'selected' : ''}>Food</option>
                    <option value="receipt" ${category === 'receipt' ? 'selected' : ''}>Receipt</option>
                    <option value="workout" ${category === 'workout' ? 'selected' : ''}>Workout</option>
                </select>
                
                <label>Description:</label>
                <textarea id="description" name="description" rows="3" placeholder="Enter description...">${testData.description}</textarea>
                
                <label>Image URL (optional):</label>
                <input type="url" id="imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg" />
                
                <label>
                    <input type="checkbox" id="debug" name="debug" ${debug ? 'checked' : ''}> Debug Mode
                </label>
                
                <br><br>
                <button type="submit">Test Workflow</button>
            </form>
        </div>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const data = {
                    description: formData.get('description'),
                    imageUrl: formData.get('imageUrl') || null,
                    workflowConfig: { 
                        debug: formData.get('debug') === 'on',
                        testMode: true 
                    }
                };
                
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<p>Testing workflow...</p>';
                
                try {
                    const response = await fetch('/functions/v1/langgraph-workflow', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + '${Deno.env.get("SUPABASE_ANON_KEY")}'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    resultDiv.innerHTML = \`
                        <div class="result \${result.success ? '' : 'error'}">
                            <h3>Result</h3>
                            <pre>\${JSON.stringify(result, null, 2)}</pre>
                        </div>
                    \`;
                } catch (error) {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            <h3>Error</h3>
                            <p>\${error.message}</p>
                        </div>
                    \`;
                }
            });
        </script>
    </body>
    </html>
  `;

  return new Response(htmlResponse, {
    headers: { ...corsHeaders, "Content-Type": "text/html" }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Handle test endpoint
  if (req.method === "GET" && url.pathname.includes('/test')) {
    return handleTestRequest(url);
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

    const debugMode = workflowConfig?.debug === true;
    const workflow = new LangGraphWorkflow(supabaseClient, openaiApiKey, debugMode);
    const result = await workflow.executeWorkflow(description, imageUrl, workflowConfig);

    // Handle failed workflows with graceful error responses
    if (!result.success) {
      console.log(`Workflow failed with error type: ${result.errorType}`);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

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
    
    // Handle OpenAI specific errors gracefully
    const errorInfo = handleOpenAIError(error);
    if (errorInfo.shouldFallback) {
      return new Response(JSON.stringify({ 
        success: false,
        error: errorInfo.userMessage,
        errorType: errorInfo.isQuotaError ? 'quota_exceeded' : 'rate_limited',
        fallbackSuggestion: 'Please try again later or contact support if this issue persists.',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }
    
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
