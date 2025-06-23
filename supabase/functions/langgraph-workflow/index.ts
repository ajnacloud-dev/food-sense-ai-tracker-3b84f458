import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced PDF text extraction with better error handling
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log(`Enhanced PDF extraction for: ${pdfUrl}`);
    
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Enhanced text extraction with better patterns
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Enhanced cleaning with receipt-specific patterns
    text = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s$.,%-]/g, '') // Keep only alphanumeric and common symbols
      .trim();
    
    // Look for receipt patterns (prices, dates, store names)
    const receiptPatterns = text.match(/\$?\d+\.?\d*|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]+\s+[A-Z][a-z]+/g);
    
    if (receiptPatterns && receiptPatterns.length >= 5) {
      const extractedText = receiptPatterns.slice(0, 200).join(' ');
      console.log(`Enhanced PDF extraction successful: ${receiptPatterns.length} patterns found`);
      return extractedText;
    }
    
    // Fallback to word extraction
    const words = text.split(' ').filter(word => 
      word.length > 1 && 
      /^[a-zA-Z0-9$.,%-]+$/.test(word)
    );
    
    if (words.length < 5) {
      throw new Error('Insufficient meaningful content extracted from PDF');
    }
    
    return words.slice(0, 300).join(' ');
  } catch (error) {
    console.error('Enhanced PDF extraction failed:', error);
    throw new Error('PDF processing failed. Please try with a clearer image or different file format.');
  }
}

// Enhanced error handling with better user messages
function handleOpenAIError(error: any): { isQuotaError: boolean, userMessage: string, shouldFallback: boolean } {
  console.error('OpenAI API Error:', error);
  
  if (error.message?.includes('insufficient_quota') || error.message?.includes('quota')) {
    return {
      isQuotaError: true,
      userMessage: 'AI analysis temporarily unavailable due to usage limits. Please try again later.',
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
  
  if (error.message?.includes('model_not_found')) {
    return {
      isQuotaError: false,
      userMessage: 'AI model configuration error. Please contact support.',
      shouldFallback: false
    };
  }
  
  return {
    isQuotaError: false,
    userMessage: 'AI analysis failed. Please try again with a different image or description.',
    shouldFallback: false
  };
}

// Enhanced image conversion with better error handling
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`Converting image to base64: ${imageUrl}`);
    const response = await fetch(imageUrl, { 
      headers: { 'User-Agent': 'SupabaseEdgeFunction/1.0' } 
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Empty image file received');
    }
    
    if (arrayBuffer.byteLength > 20 * 1024 * 1024) { // 20MB limit
      throw new Error('Image file too large (max 20MB)');
    }
    
    const bytes = new Uint8Array(arrayBuffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const base64 = btoa(binary);
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    console.log(`Image converted successfully: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`);
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

// Dynamic model selection service
class ModelSelectionService {
  private supabaseClient: any;
  private modelsCache: any[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async getAvailableModels(userTier: string = 'free') {
    await this.refreshCacheIfNeeded();
    
    return this.modelsCache.filter(model => {
      if (userTier === 'free') return model.required_subscription_tier === 'free';
      if (userTier === 'pro') return ['free', 'pro'].includes(model.required_subscription_tier);
      if (userTier === 'enterprise') return ['free', 'pro', 'enterprise'].includes(model.required_subscription_tier);
      return false;
    });
  }

  async getOptimalModel(userTier: string, complexity: string, requiresVision: boolean = false) {
    const availableModels = await this.getAvailableModels(userTier);
    
    // Filter by vision requirement
    const visionFiltered = requiresVision 
      ? availableModels.filter(model => model.supports_vision)
      : availableModels;

    if (visionFiltered.length === 0) {
      throw new Error('No suitable models available for your subscription tier');
    }

    // Smart model selection based on complexity
    switch (complexity) {
      case 'simple':
        return this.findModelByCategory(visionFiltered, 'efficient') ||
               visionFiltered.find(model => model.is_default) ||
               visionFiltered[0];

      case 'moderate':
        return this.findModelByCategory(visionFiltered, 'powerful') ||
               this.findModelByCategory(visionFiltered, 'general') ||
               visionFiltered[0];

      case 'complex':
        return this.findModelByCategory(visionFiltered, 'flagship') ||
               this.findModelByCategory(visionFiltered, 'reasoning') ||
               this.findModelByCategory(visionFiltered, 'powerful') ||
               visionFiltered[0];

      default:
        return visionFiltered.find(model => model.is_default) || visionFiltered[0];
    }
  }

  async getFallbackChain(userTier: string, primaryModel: string) {
    const availableModels = await this.getAvailableModels(userTier);
    const chain = [primaryModel];
    
    // Add efficient models as fallbacks
    const fallbacks = availableModels
      .filter(model => model.model_id !== primaryModel)
      .sort((a, b) => a.input_cost_per_1k_tokens - b.input_cost_per_1k_tokens)
      .map(model => model.model_id);
    
    return [...chain, ...fallbacks];
  }

  detectContentComplexity(description: string, fileUrl: string | null): string {
    const text = description?.toLowerCase() || '';
    
    // Complex patterns (need powerful models)
    const complexPatterns = [
      /nutrition|calories|protein|carbs|vitamins|detailed|comprehensive|analyze/,
      /workout|exercise|fitness|training|complex|advanced/,
      /medical|health|assessment|diagnosis|clinical/
    ];
    
    // Simple patterns (can use cheaper models)
    const simplePatterns = [
      /receipt|bill|invoice|purchase|simple|basic/,
      /\$\d+|\d+\.\d+|total|subtotal/,
      /walmart|target|costco|amazon/i
    ];
    
    const isPDF = fileUrl?.toLowerCase().includes('.pdf');
    const isLongText = text.length > 200;
    
    if (complexPatterns.some(pattern => pattern.test(text)) || isPDF) {
      return 'complex';
    }
    
    if (simplePatterns.some(pattern => pattern.test(text)) && !isLongText) {
      return 'simple';
    }
    
    return 'moderate';
  }

  private async refreshCacheIfNeeded() {
    const now = Date.now();
    if (now - this.cacheTimestamp > this.CACHE_TTL || this.modelsCache.length === 0) {
      await this.refreshCache();
    }
  }

  private async refreshCache() {
    try {
      const { data, error } = await this.supabaseClient
        .from('models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      this.modelsCache = data || [];
      this.cacheTimestamp = Date.now();
      console.log(`Model cache refreshed with ${this.modelsCache.length} models`);
    } catch (error) {
      console.error('Failed to refresh model cache:', error);
      // Keep existing cache on error
    }
  }

  private findModelByCategory(models: any[], category: string) {
    return models.find(model => model.category === category) || null;
  }
}

class OptimizedLangGraphWorkflow {
  private supabaseClient: any;
  private openaiApiKey: string;
  private modelService: ModelSelectionService;
  private totalTokens: number = 0;
  private totalCost: number = 0;
  private selectedModel: any = null;

  constructor(supabaseClient: any, openaiApiKey: string) {
    this.supabaseClient = supabaseClient;
    this.openaiApiKey = openaiApiKey;
    this.modelService = new ModelSelectionService(supabaseClient);
    
    console.log('Initialized OptimizedLangGraphWorkflow with dynamic model selection');
  }

  async executeWorkflow(description: string, fileUrl: string | null, workflowConfig: any, userTier: string = 'free'): Promise<any> {
    const workflowStartTime = Date.now();
    console.log('Starting optimized LangGraph workflow with dynamic model selection');
    
    try {
      // Detect content complexity and select optimal model
      const complexity = this.modelService.detectContentComplexity(description, fileUrl);
      const requiresVision = fileUrl && !fileUrl.toLowerCase().includes('.pdf');
      
      this.selectedModel = await this.modelService.getOptimalModel(userTier, complexity, requiresVision);
      console.log(`Selected model: ${this.selectedModel.name} (${this.selectedModel.model_id}) for ${complexity} complexity`);

      const useSimplifiedFlow = complexity === 'simple' && workflowConfig?.simplifiedFlow !== false;
      console.log(`Content complexity: ${complexity}, simplified flow: ${useSimplifiedFlow}`);

      if (useSimplifiedFlow) {
        // Single-step analysis for simple content
        const result = await this.directAnalysis(description, fileUrl);
        return {
          success: true,
          result: {
            classification: { category: result.category, confidence: 0.95 },
            analysis: result
          },
          metadata: {
            totalTokens: this.totalTokens,
            totalCost: this.totalCost,
            processingTime: Date.now() - workflowStartTime,
            workflow: 'simplified',
            modelUsed: this.selectedModel.model_id
          }
        };
      } else {
        // Two-step workflow for complex content
        const classification = await this.classifyContent(description, fileUrl);
        const analysis = await this.analyzeContent(description, fileUrl, classification.category);
        
        return {
          success: true,
          result: { classification, analysis },
          metadata: {
            totalTokens: this.totalTokens,
            totalCost: this.totalCost,
            processingTime: Date.now() - workflowStartTime,
            workflow: 'full',
            modelUsed: this.selectedModel.model_id
          }
        };
      }

    } catch (error) {
      console.error('Optimized workflow execution failed:', error);
      
      const errorInfo = handleOpenAIError(error);
      if (errorInfo.shouldFallback) {
        return {
          success: false,
          error: errorInfo.userMessage,
          errorType: errorInfo.isQuotaError ? 'quota_exceeded' : 'rate_limited'
        };
      }
      
      throw error;
    }
  }

  async directAnalysis(description: string, fileUrl: string | null): Promise<any> {
    console.log('Using direct analysis for simple content');
    
    // Smart category detection from content
    const text = description?.toLowerCase() || '';
    let category = 'food'; // default
    
    if (/receipt|bill|invoice|purchase|\$|total|store|shop/i.test(text)) {
      category = 'receipt';
    } else if (/workout|exercise|fitness|gym|training|run|bike|swim/i.test(text)) {
      category = 'workout';
    }

    // Get optimized prompt for direct analysis
    const { data: prompt } = await this.supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

    const analysis = await this.performAnalysis(description, fileUrl, prompt, category);
    return { ...analysis, category };
  }

  async classifyContent(description: string, fileUrl: string | null): Promise<any> {
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

    let fileContent = '';
    let isPDF = false;
    
    if (fileUrl) {
      isPDF = fileUrl.toLowerCase().includes('.pdf');
      if (isPDF) {
        try {
          fileContent = await extractTextFromPDF(fileUrl);
        } catch (error) {
          console.error('PDF extraction failed:', error);
          fileContent = 'PDF file provided but text extraction failed';
        }
      }
    }

    const prompt = `You are an AI classifier for health and lifestyle content.

Analyze and classify into: food, receipt, or workout

Current time: ${currentTime}

Input:
${description ? `Description: ${description}` : 'No description provided'}
${fileUrl ? `File: ${isPDF ? 'PDF document' : 'Image'} provided` : 'No file provided'}
${fileContent ? `Content: ${fileContent.substring(0, 500)}...` : ''}

Return valid JSON only:
{
  "category": "food|receipt|workout",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;

    const messages = [
      { role: 'system', content: 'You are a precise content classifier. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    if (fileUrl && !isPDF) {
      try {
        const base64Image = await imageUrlToBase64(fileUrl);
        messages[1].content = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image:', error);
      }
    }

    const response = await this.callOpenAI(messages, this.selectedModel.model_id, 300);
    return this.safeJsonParse(response.content, 'classification');
  }

  async analyzeContent(description: string, fileUrl: string | null, category: string): Promise<any> {
    const { data: prompt } = await this.supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

    return this.performAnalysis(description, fileUrl, prompt, category);
  }

  async performAnalysis(description: string, fileUrl: string | null, prompt: any, category: string): Promise<any> {
    const now = new Date();
    const timeContext = `Current time: ${now.toLocaleString()}`;

    let enhancedPrompt = prompt.user_prompt_template.replace('{description}', description || 'No description provided');
    
    let fileContent = '';
    let isPDF = false;
    
    if (fileUrl) {
      isPDF = fileUrl.toLowerCase().includes('.pdf');
      if (isPDF) {
        try {
          fileContent = await extractTextFromPDF(fileUrl);
          enhancedPrompt += `\n\nPDF Content: ${fileContent}`;
        } catch (error) {
          enhancedPrompt += '\n\nNote: PDF file provided but text extraction failed.';
        }
      }
    }

    // Enhanced category-specific prompts with strict validation
    if (category === 'food') {
      enhancedPrompt += `${timeContext}

CRITICAL INSTRUCTIONS:
1. Analyze all visible food items and estimate nutrition accurately
2. Determine meal type from current time: breakfast (5-10 AM), lunch (10 AM-2 PM), snack (2-5 PM), dinner (5-10 PM), late night (10 PM-5 AM)
3. Provide detailed nutritional breakdown with realistic estimates
4. Structure response to match database schema exactly`;
    } else if (category === 'receipt') {
      enhancedPrompt += `

CRITICAL RECEIPT ANALYSIS REQUIREMENTS:
1. Extract ONLY line items that are clearly visible and readable
2. NEVER add items that are not explicitly shown on the receipt
3. NEVER enrich item names with generic descriptions like "organic" or "fresh"
4. If any text is unclear or illegible, skip that item completely
5. Double-check that each item name matches exactly what is written
6. Verify prices and quantities against what is visible
7. Identify correct final total (after taxes/discounts)
8. Extract merchant information and purchase date only if clearly visible
9. Be conservative - it is better to miss an item than to add a wrong one
10. ONLY process what is available and clearly readable on the receipt`;
    } else if (category === 'workout') {
      enhancedPrompt += `

WORKOUT ANALYSIS REQUIREMENTS:
1. Identify specific exercises, sets, reps, and weights
2. Estimate calories burned based on activity intensity
3. Determine workout type and duration
4. Structure exercise data for database storage`;
    }

    enhancedPrompt += '\n\nIMPORTANT: Return ONLY valid JSON (no markdown, no code blocks). Never hallucinate or add information not explicitly visible.';
    
    const messages = [
      { role: 'system', content: `${prompt.system_prompt}\n\nAlways respond with valid JSON only. NEVER hallucinate or add items/information not explicitly visible.` },
      { role: 'user', content: enhancedPrompt }
    ];

    if (fileUrl && !isPDF) {
      try {
        const base64Image = await imageUrlToBase64(fileUrl);
        messages[1].content = [
          { type: 'text', text: enhancedPrompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image:', error);
      }
    }

    const model = category === 'receipt' ? this.selectedModel.model_id : this.selectedModel.model_id;
    const response = await this.callOpenAI(messages, model, 1500);
    return this.safeJsonParse(response.content, 'analysis');
  }

  private async callOpenAI(messages: any[], model: string, maxTokens: number): Promise<any> {
    try {
      console.log(`OpenAI API call - Model: ${model}, Max tokens: ${maxTokens}, Temperature: 0`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        
        // Try fallback models if primary fails
        if (response.status === 404) {
          const fallbackChain = await this.modelService.getFallbackChain('free', model);
          for (const fallbackModel of fallbackChain.slice(1)) {
            console.log(`Trying fallback model: ${fallbackModel}`);
            try {
              return await this.callOpenAI(messages, fallbackModel, maxTokens);
            } catch (fallbackError) {
              console.error(`Fallback model ${fallbackModel} also failed:`, fallbackError);
              continue;
            }
          }
        }
        
        if (errorText.includes('insufficient_quota')) {
          throw new Error('insufficient_quota: OpenAI API quota exceeded');
        }
        if (errorText.includes('rate_limit')) {
          throw new Error('rate_limit: OpenAI API rate limit exceeded');
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Enhanced usage tracking with model-specific pricing
      if (data.usage && this.selectedModel) {
        this.totalTokens += data.usage.total_tokens;
        this.totalCost += (data.usage.prompt_tokens / 1000 * this.selectedModel.input_cost_per_1k_tokens) + 
                         (data.usage.completion_tokens / 1000 * this.selectedModel.output_cost_per_1k_tokens);
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private safeJsonParse(text: string, context: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(`JSON parse failed in ${context}:`, text);
      
      // Enhanced JSON extraction
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                       text.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        try {
          const cleanJson = jsonMatch[1]
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ');
          return JSON.parse(cleanJson);
        } catch (e) {
          console.error('Failed to parse cleaned JSON:', e);
        }
      }
      
      throw new Error(`Invalid JSON response in ${context}`);
    }
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

    console.log(`Starting optimized workflow for user ${user.id}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // TODO: Get actual user tier from subscription data
    const userTier = 'free'; // Default for now

    const workflow = new OptimizedLangGraphWorkflow(supabaseClient, openaiApiKey);
    const result = await workflow.executeWorkflow(description, imageUrl, workflowConfig || {}, userTier);

    if (!result.success) {
      console.log(`Workflow failed: ${result.errorType}`);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

    // Enhanced usage logging with model information
    if (result.metadata?.totalTokens > 0) {
      await supabaseClient
        .from('api_costs')
        .insert({
          user_id: user.id,
          function_name: 'langgraph-workflow-optimized',
          prompt_tokens: Math.floor(result.metadata.totalTokens * 0.7),
          completion_tokens: Math.floor(result.metadata.totalTokens * 0.3),
          total_tokens: result.metadata.totalTokens,
          cost_usd: result.metadata.totalCost,
          model_used: result.metadata.modelUsed || 'gpt-4o-mini',
          category: result.result.classification?.category || 'unknown'
        });
    }

    const processingTime = Date.now() - startTime;
    console.log(`Optimized workflow completed in ${processingTime}ms using ${result.metadata.workflow} flow with model ${result.metadata.modelUsed}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in optimized workflow:", error);
    
    const errorInfo = handleOpenAIError(error);
    if (errorInfo.shouldFallback) {
      return new Response(JSON.stringify({ 
        success: false,
        error: errorInfo.userMessage,
        errorType: errorInfo.isQuotaError ? 'quota_exceeded' : 'rate_limited'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
