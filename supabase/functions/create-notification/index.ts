
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, analysisId, type, title, message } = await req.json()

    console.log('Creating notification for user:', userId, 'analysis:', analysisId)

    // Create notification in database
    const { data: notification, error } = await supabaseClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        analysis_id: analysisId,
        notification_type: type,
        title,
        message,
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    console.log('Notification created successfully:', notification)

    return new Response(
      JSON.stringify({ success: true, notification }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
