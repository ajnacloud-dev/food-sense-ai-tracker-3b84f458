
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

    if (!pendingAnalysisId) {
      return new Response(
        JSON.stringify({ error: 'Missing pendingAnalysisId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('pending_analyses')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);

    // Start background analysis
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
  try {
    let result;
    
    if (useAdvanced) {
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
        throw new Error(workflowError.message || 'Advanced workflow failed');
      }

      result = workflowResult;
    } else {
      // Call standard analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('auto-classify-and-analyze', {
          body: { description, imageUrl }
        });

      if (analysisError) {
        throw new Error(analysisError.message || 'Analysis failed');
      }

      result = analysisResult;
    }

    // Update with successful result
    await supabase
      .from('pending_analyses')
      .update({
        status: 'completed',
        category: result.category || (result.result?.classification?.category),
        analysis_result: result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);

    console.log(`Analysis ${pendingAnalysisId} completed successfully`);

  } catch (error) {
    console.error(`Analysis ${pendingAnalysisId} failed:`, error);
    
    // Update with error
    await supabase
      .from('pending_analyses')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingAnalysisId);
  }
}
