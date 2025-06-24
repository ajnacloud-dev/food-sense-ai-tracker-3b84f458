
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

// Use a static version instead of generating new timestamps
const CURRENT_APP_VERSION = Deno.env.get('APP_VERSION') || 'v1.0.0';

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

    // Return consistent version - only change when there's a real update
    const forceUpdate = Deno.env.get('FORCE_UPDATE') === 'true';

    const response: AppVersionResponse = {
      version: CURRENT_APP_VERSION,
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
      version: CURRENT_APP_VERSION,
      timestamp: Date.now(),
      forceUpdate: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
