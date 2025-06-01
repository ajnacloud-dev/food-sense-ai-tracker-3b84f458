
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pendingAnalysisId, description, imageUrl, useAdvanced = false } = await req.json();

    console.log('Starting async analysis:', {
      pendingAnalysisId,
      description: description?.substring(0, 100),
      hasImage: !!imageUrl,
      useAdvanced
    });

    if (!pendingAnalysisId) {
      console.error('Missing pendingAnalysisId');
      return new Response(
        JSON.stringify({ error: 'Missing pendingAnalysisId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    console.log('Updating status to processing for:', pendingAnalysisId);
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);

    if (updateError) {
      console.error('Failed to update status to processing:', updateError);
      throw updateError;
    }

    // Start background analysis with timeout
    console.log('Starting background processing for:', pendingAnalysisId);
    EdgeRuntime.waitUntil(processAnalysisInBackground(
      supabase,
      pendingAnalysisId,
      description,
      imageUrl,
      useAdvanced
    ));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis started in background',
        pendingAnalysisId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Async analyze error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAnalysisInBackground(
  supabase: any,
  pendingAnalysisId: string,
  description: string,
  imageUrl: string | null,
  useAdvanced: boolean
) {
  const startTime = Date.now();
  console.log(`Background processing started for ${pendingAnalysisId}`);

  try {
    let result;
    
    if (useAdvanced) {
      console.log(`Calling advanced workflow for ${pendingAnalysisId}`);
      // Call the advanced workflow
      const { data: workflowResult, error: workflowError } = await supabase.functions
        .invoke('langgraph-workflow', {
          body: {
            description,
            imageUrl,
            workflowConfig: null
          }
        });

      if (workflowError) {
        console.error(`Advanced workflow error for ${pendingAnalysisId}:`, workflowError);
        throw new Error(`Advanced workflow failed: ${workflowError.message || 'Unknown error'}`);
      }

      console.log(`Advanced workflow completed for ${pendingAnalysisId}`);
      result = workflowResult;
    } else {
      console.log(`Calling standard analysis for ${pendingAnalysisId}`);
      // Call standard analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('auto-classify-and-analyze', {
          body: { description, imageUrl }
        });

      if (analysisError) {
        console.error(`Standard analysis error for ${pendingAnalysisId}:`, analysisError);
        throw new Error(`Analysis failed: ${analysisError.message || 'Unknown error'}`);
      }

      console.log(`Standard analysis completed for ${pendingAnalysisId}`);
      result = analysisResult;
    }

    // Extract category from result
    let category = result.category;
    if (!category && result.result?.classification?.category) {
      category = result.result.classification.category;
    }
    if (!category && result.result?.category) {
      category = result.result.category;
    }

    console.log(`Updating analysis ${pendingAnalysisId} as completed with category: ${category}`);

    // Update with successful result
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'completed',
        category: category || 'unknown',
        analysis_result: result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);

    if (updateError) {
      console.error(`Failed to update completed analysis ${pendingAnalysisId}:`, updateError);
      throw updateError;
    }

    const duration = Date.now() - startTime;
    console.log(`Analysis ${pendingAnalysisId} completed successfully in ${duration}ms`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Analysis ${pendingAnalysisId} failed after ${duration}ms:`, error);
    
    // Update with error
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error occurred',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);

    if (updateError) {
      console.error(`Failed to update failed analysis ${pendingAnalysisId}:`, updateError);
    }
  }
}
