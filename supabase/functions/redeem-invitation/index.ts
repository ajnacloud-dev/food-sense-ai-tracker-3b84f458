
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invitationCode, userId } = await req.json();

    if (!invitationCode || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing invitationCode or userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing invitation redemption for code: ${invitationCode}, user: ${userId}`);

    // Find the invitation code
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitation_codes')
      .select('*')
      .eq('code', invitationCode)
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation not found:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid invitation code' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if invitation is still valid
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Invitation code has expired' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (invitation.current_uses >= invitation.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Invitation code has reached its usage limit' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if this user has already used this invitation (unless it's self-caretaking)
    if (userId !== invitation.created_by) {
      const { data: existingRelationship } = await supabaseClient
        .from('care_relationships')
        .select('id')
        .eq('caretaker_id', userId)
        .eq('user_id', invitation.created_by)
        .single();

      if (existingRelationship) {
        return new Response(
          JSON.stringify({ error: 'You already have a relationship with this participant' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Create the care relationship (allow self-caretaking)
    const { error: relationshipError } = await supabaseClient
      .from('care_relationships')
      .insert({
        user_id: invitation.created_by,
        caretaker_id: userId,
        caretaker_type: invitation.caretaker_type,
        permission_level: invitation.permission_level,
        status: 'active',
        invited_by: invitation.created_by,
        approved_at: new Date().toISOString()
      });

    if (relationshipError) {
      console.error('Error creating care relationship:', relationshipError);
      return new Response(
        JSON.stringify({ error: 'Failed to create care relationship' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update invitation usage
    const { error: updateError } = await supabaseClient
      .from('invitation_codes')
      .update({
        current_uses: invitation.current_uses + 1,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation usage:', updateError);
      // Don't fail the request as the relationship was created successfully
    }

    // Update user role to include caretaker capabilities
    const { error: userUpdateError } = await supabaseClient
      .from('users')
      .update({ 
        role: 'caretaker' 
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user role:', userUpdateError);
      // Don't fail the request as the relationship was created successfully
    }

    const relationshipType = userId === invitation.created_by ? 'self-caretaking' : 'caretaking';
    console.log(`Successfully redeemed invitation code ${invitationCode} for user ${userId} (${relationshipType})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation code redeemed successfully',
        relationshipCreated: true,
        selfCaretaking: userId === invitation.created_by
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in redeem-invitation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
