
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
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        const fixedJson = jsonStr
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ');
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
      userMessage: 'AI analysis is temporarily unavailable due to usage limits. Please try again later.',
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

// Utility function to extract text from PDF
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log(`Extracting text from PDF: ${pdfUrl}`);
    
    // Fetch the PDF file
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple text extraction - look for readable text patterns
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Clean up the text - remove control characters and extract readable content
    text = text.replace(/[\x00-\x1F\x7F]/g, ' ')
             .replace(/\s+/g, ' ')
             .trim();
    
    // Try to find meaningful text content (basic heuristic)
    const words = text.split(' ').filter(word => 
      word.length > 2 && 
      /^[a-zA-Z0-9$.,%-]+$/.test(word)
    );
    
    if (words.length < 10) {
      throw new Error('Could not extract meaningful text from PDF');
    }
    
    const extractedText = words.slice(0, 1000).join(' '); // Limit to first 1000 words
    console.log(`Extracted ${words.length} words from PDF`);
    
    return extractedText;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF. Please try with an image instead.');
  }
}

// Utility function to convert image URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`Converting image to base64: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
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

class SimplifiedLangGraphWorkflow {
  private supabaseClient: any;
  private openaiApiKey: string;
  private totalTokens: number = 0;
  private totalCost: number = 0;

  constructor(supabaseClient: any, openaiApiKey: string) {
    this.supabaseClient = supabaseClient;
    this.openaiApiKey = openaiApiKey;
  }

  async executeWorkflow(description: string, fileUrl: string | null, workflowConfig: any): Promise<any> {
    const workflowStartTime = Date.now();
    console.log('Starting simplified LangGraph workflow');
    
    try {
      // Step 1: Classification
      const classification = await this.classifyContent(description, fileUrl);
      console.log('Classification result:', classification);

      // Step 2: Detailed Analysis
      const analysis = await this.analyzeContent(description, fileUrl, classification.category);
      console.log('Analysis completed for category:', classification.category);

      const result = {
        success: true,
        result: {
          classification,
          analysis
        },
        metadata: {
          totalTokens: this.totalTokens,
          totalCost: this.totalCost,
          processingTime: Date.now() - workflowStartTime
        }
      };

      return result;

    } catch (error) {
      console.error('Workflow execution failed:', error);
      
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
    
    // Handle file content extraction
    if (fileUrl) {
      isPDF = fileUrl.toLowerCase().includes('.pdf') || fileUrl.includes('application/pdf');
      
      if (isPDF) {
        try {
          fileContent = await extractTextFromPDF(fileUrl);
        } catch (error) {
          console.error('PDF extraction failed:', error);
          fileContent = 'PDF file provided but text extraction failed';
        }
      }
    }

    const prompt = `You are an AI classifier that determines the category of content.

Analyze the provided content and classify it into one of these categories:
- food: Any food items, meals, beverages, nutrition-related content, cooking, restaurants, recipes
- receipt: Shopping receipts, bills, invoices, purchase documents, store receipts, payment confirmations  
- workout: Exercise activities, fitness routines, sports, physical activities, gym equipment, athletic activities

Current time: ${currentTime}

Input:
${description ? `Description: ${description}` : 'No description provided'}
${fileUrl ? `File: ${isPDF ? 'PDF document' : 'Image'} provided` : 'No file provided'}
${fileContent ? `File content: ${fileContent.substring(0, 500)}...` : ''}

Return ONLY a valid JSON object:
{
  "category": "food",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification"
}`;

    const messages = [
      { role: 'system', content: 'You are a precise content classifier. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    // Add image if provided and not PDF
    if (fileUrl && !isPDF) {
      try {
        const base64Image = await imageUrlToBase64(fileUrl);
        messages[1].content = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image, continuing without it:', error);
      }
    }

    const response = await this.callOpenAI(messages, 'gpt-4o-mini', 300);
    return safeJsonParse(response.content, 'classification');
  }

  async analyzeContent(description: string, fileUrl: string | null, category: string): Promise<any> {
    // Get category-specific prompt
    const { data: prompt } = await this.supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No active prompt found for category: ${category}`);
    }

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
Hour (24h format): ${hour}`;

    let enhancedUserPrompt = prompt.user_prompt_template.replace('{description}', description || 'No description provided');
    
    // Handle file content
    let fileContent = '';
    let isPDF = false;
    
    if (fileUrl) {
      isPDF = fileUrl.toLowerCase().includes('.pdf') || fileUrl.includes('application/pdf');
      
      if (isPDF) {
        try {
          fileContent = await extractTextFromPDF(fileUrl);
          enhancedUserPrompt += `\n\nPDF Content: ${fileContent}`;
        } catch (error) {
          console.error('PDF extraction failed:', error);
          enhancedUserPrompt += '\n\nNote: PDF file was provided but text extraction failed.';
        }
      }
    }

    // Add category-specific enhancements
    if (category === 'food') {
      enhancedUserPrompt += `${timeContext}

IMPORTANT: 
1. Analyze the content to identify food items and nutritional information.
2. Determine meal type based on the current time:
   - 5-10 AM: breakfast
   - 10 AM-2 PM: lunch  
   - 2-5 PM: snack
   - 5-10 PM: dinner
   - 10 PM-5 AM: late night snack
3. Provide detailed nutritional estimates based on the identified foods.
4. If specific dishes are mentioned or shown, name them accurately.`;
    }

    if (category === 'receipt') {
      enhancedUserPrompt += `

CRITICAL RECEIPT ANALYSIS:
1. Carefully read ALL numbers - look for subtotals, taxes, discounts, and final total
2. The "total" field should be the FINAL amount paid
3. Extract all line items with their prices and quantities
4. Look for merchant/store information
5. Identify the date of purchase`;
    }

    const analysisPrompt = `${enhancedUserPrompt}

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks).`;
    
    const messages = [
      { role: 'system', content: `${prompt.system_prompt}\n\nALWAYS respond with valid JSON only.` },
      { role: 'user', content: analysisPrompt }
    ];

    // Add image if provided and not PDF
    if (fileUrl && !isPDF) {
      try {
        const base64Image = await imageUrlToBase64(fileUrl);
        messages[1].content = [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ];
      } catch (error) {
        console.error('Failed to process image, continuing without it:', error);
      }
    }

    const response = await this.callOpenAI(messages, 'gpt-4o', 1500);
    return safeJsonParse(response.content, 'analysis');
  }

  private async callOpenAI(messages: any[], model: string, maxTokens: number): Promise<any> {
    try {
      console.log(`OpenAI API call - Model: ${model}, Max tokens: ${maxTokens}`);
      
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
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
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

    console.log(`Starting simplified LangGraph workflow for user ${user.id}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const workflow = new SimplifiedLangGraphWorkflow(supabaseClient, openaiApiKey);
    const result = await workflow.executeWorkflow(description, imageUrl, workflowConfig);

    // Handle failed workflows
    if (!result.success) {
      console.log(`Workflow failed with error type: ${result.errorType}`);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

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

    const processingTime = Date.now() - startTime;
    console.log(`Simplified LangGraph workflow completed in ${processingTime}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in simplified LangGraph workflow:", error);
    
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
