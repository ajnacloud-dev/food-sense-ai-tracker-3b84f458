
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AppVersionResponse {
  version: string;
  timestamp: number;
  forceUpdate: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate version based on current timestamp (you can customize this)
    const version = Deno.env.get('APP_VERSION') || `v${Date.now()}`;
    // Force update is now always true by default, unless explicitly set to false
    const forceUpdate = Deno.env.get('FORCE_UPDATE') !== 'false';

    const response: AppVersionResponse = {
      version,
      timestamp: Date.now(),
      forceUpdate
    };

    console.log('Version check requested:', response);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in app-version function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      version: 'unknown',
      timestamp: Date.now(),
      forceUpdate: true // Default to force update even on error
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
