
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowNode {
  id: string;
  type: 'classifier' | 'analyzer' | 'enricher' | 'validator';
  config: Record<string, any>;
  next?: string[];
}

interface WorkflowDefinition {
  nodes: WorkflowNode[];
  startNode: string;
}

interface WorkflowState {
  input: {
    description?: string;
    imageUrl?: string;
    category?: string;
  };
  classification?: any;
  analysis?: any;
  enrichment?: any;
  validation?: any;
  errors: string[];
  currentNode: string;
  metadata: {
    startTime: number;
    costs: number;
    tokensUsed: number;
  };
}

// Default workflow for content analysis
const DEFAULT_WORKFLOW: WorkflowDefinition = {
  startNode: "classify",
  nodes: [
    {
      id: "classify",
      type: "classifier",
      config: {
        model: "gpt-4o-mini",
        temperature: 0.1
      },
      next: ["analyze"]
    },
    {
      id: "analyze",
      type: "analyzer", 
      config: {
        model: "gpt-4o",
        temperature: 0.3
      },
      next: ["enrich"]
    },
    {
      id: "enrich",
      type: "enricher",
      config: {
        model: "gpt-4o-mini",
        temperature: 0.2
      },
      next: ["validate"]
    },
    {
      id: "validate",
      type: "validator",
      config: {
        model: "gpt-4o-mini",
        temperature: 0.1
      },
      next: []
    }
  ]
};

class LangGraphWorkflow {
  private state: WorkflowState;
  private workflow: WorkflowDefinition;
  private supabaseClient: any;
  private openaiKey: string;

  constructor(
    input: { description?: string; imageUrl?: string; category?: string },
    supabaseClient: any,
    openaiKey: string,
    customWorkflow?: WorkflowDefinition
  ) {
    this.state = {
      input,
      errors: [],
      currentNode: customWorkflow?.startNode || DEFAULT_WORKFLOW.startNode,
      metadata: {
        startTime: Date.now(),
        costs: 0,
        tokensUsed: 0
      }
    };
    this.workflow = customWorkflow || DEFAULT_WORKFLOW;
    this.supabaseClient = supabaseClient;
    this.openaiKey = openaiKey;
  }

  async executeWorkflow(): Promise<WorkflowState> {
    console.log(`Starting LangGraph workflow with node: ${this.state.currentNode}`);
    
    while (this.state.currentNode) {
      const node = this.workflow.nodes.find(n => n.id === this.state.currentNode);
      if (!node) {
        this.state.errors.push(`Node not found: ${this.state.currentNode}`);
        break;
      }

      console.log(`Executing node: ${node.id} (${node.type})`);
      
      try {
        await this.executeNode(node);
        
        // Move to next node
        if (node.next && node.next.length > 0) {
          // For simplicity, always take first next node
          // In a real implementation, this could be conditional
          this.state.currentNode = node.next[0];
        } else {
          this.state.currentNode = '';
        }
      } catch (error) {
        console.error(`Error in node ${node.id}:`, error);
        this.state.errors.push(`Node ${node.id}: ${error.message}`);
        break;
      }
    }

    console.log(`Workflow completed in ${Date.now() - this.state.metadata.startTime}ms`);
    return this.state;
  }

  private async executeNode(node: WorkflowNode): Promise<void> {
    switch (node.type) {
      case 'classifier':
        await this.executeClassifier(node);
        break;
      case 'analyzer':
        await this.executeAnalyzer(node);
        break;
      case 'enricher':
        await this.executeEnricher(node);
        break;
      case 'validator':
        await this.executeValidator(node);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeClassifier(node: WorkflowNode): Promise<void> {
    const prompt = `You are an AI classifier. Analyze the content and classify it into: food, receipt, or workout.

Input:
${this.state.input.description ? `Description: ${this.state.input.description}` : 'No description'}
${this.state.input.imageUrl ? 'Image provided' : 'No image'}

Return JSON: {"category": "food|receipt|workout", "confidence": 0.95, "reasoning": "explanation"}`;

    const result = await this.callOpenAI([
      { role: 'system', content: 'You are a content classifier. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], node.config);

    this.state.classification = JSON.parse(result.content);
    this.updateMetadata(result.usage);
  }

  private async executeAnalyzer(node: WorkflowNode): Promise<void> {
    if (!this.state.classification) {
      throw new Error('Classification required before analysis');
    }

    const category = this.state.classification.category;
    
    // Get category-specific prompt
    const { data: prompt } = await this.supabaseClient
      .from('prompts')
      .select('system_prompt, user_prompt_template')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error(`No prompt found for category: ${category}`);
    }

    const userPrompt = prompt.user_prompt_template.replace(
      '{description}', 
      this.state.input.description || 'No description provided'
    );

    const result = await this.callOpenAI([
      { role: 'system', content: prompt.system_prompt },
      { role: 'user', content: userPrompt }
    ], node.config);

    this.state.analysis = JSON.parse(result.content);
    this.updateMetadata(result.usage);
  }

  private async executeEnricher(node: WorkflowNode): Promise<void> {
    if (!this.state.analysis) {
      throw new Error('Analysis required before enrichment');
    }

    const enrichmentPrompt = `Enrich the following analysis with additional insights and recommendations:

Original Analysis: ${JSON.stringify(this.state.analysis)}
Category: ${this.state.classification?.category}

Add health insights, recommendations, and contextual information. Return enhanced JSON.`;

    const result = await this.callOpenAI([
      { role: 'system', content: 'You enhance data analysis with health insights and recommendations.' },
      { role: 'user', content: enrichmentPrompt }
    ], node.config);

    this.state.enrichment = JSON.parse(result.content);
    this.updateMetadata(result.usage);
  }

  private async executeValidator(node: WorkflowNode): Promise<void> {
    const validationPrompt = `Validate and clean the following data analysis:

Classification: ${JSON.stringify(this.state.classification)}
Analysis: ${JSON.stringify(this.state.analysis)}
Enrichment: ${JSON.stringify(this.state.enrichment)}

Check for inconsistencies, validate ranges, and return a cleaned version. Return JSON with validation status.`;

    const result = await this.callOpenAI([
      { role: 'system', content: 'You validate and clean data analysis results.' },
      { role: 'user', content: validationPrompt }
    ], node.config);

    this.state.validation = JSON.parse(result.content);
    this.updateMetadata(result.usage);
  }

  private async callOpenAI(messages: any[], config: any): Promise<{ content: string; usage: any }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages,
        temperature: config.temperature || 0.3,
        max_tokens: config.max_tokens || 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }

  private updateMetadata(usage: any): void {
    if (usage) {
      this.state.metadata.tokensUsed += usage.total_tokens || 0;
      // Simplified cost calculation
      this.state.metadata.costs += (usage.total_tokens || 0) * 0.00002;
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    console.log(`Starting LangGraph workflow for user ${user.id}`);

    // Create and execute workflow
    const workflow = new LangGraphWorkflow(
      { description, imageUrl },
      supabaseClient,
      openaiKey,
      workflowConfig
    );

    const result = await workflow.executeWorkflow();

    // Log costs
    await supabaseClient
      .from('api_costs')
      .insert({
        user_id: user.id,
        function_name: 'langgraph-workflow',
        prompt_tokens: 0, // Would need to track separately
        completion_tokens: 0, // Would need to track separately  
        total_tokens: result.metadata.tokensUsed,
        cost_usd: result.metadata.costs,
        model_used: 'langgraph-multi',
        category: result.classification?.category || 'unknown'
      });

    console.log(`LangGraph workflow completed. Tokens: ${result.metadata.tokensUsed}, Cost: $${result.metadata.costs.toFixed(6)}`);

    return new Response(JSON.stringify({
      success: true,
      result: {
        classification: result.classification,
        analysis: result.analysis,
        enrichment: result.enrichment,
        validation: result.validation,
        errors: result.errors,
        metadata: result.metadata
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in langgraph-workflow function:", error);
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
