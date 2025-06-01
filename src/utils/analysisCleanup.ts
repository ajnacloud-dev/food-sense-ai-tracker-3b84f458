
import { supabase } from '@/integrations/supabase/client';

export const cleanupStuckAnalyses = async (userId: string) => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  console.log('Cleaning up analyses stuck since:', oneHourAgo.toISOString());

  try {
    // Find analyses that have been pending for over 1 hour
    const { data: stuckAnalyses, error: fetchError } = await supabase
      .from('pending_analyses')
      .select('id, created_at, description')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo.toISOString());

    if (fetchError) {
      console.error('Failed to fetch stuck analyses:', fetchError);
      return { cleaned: 0, error: fetchError.message };
    }

    if (!stuckAnalyses || stuckAnalyses.length === 0) {
      console.log('No stuck analyses found');
      return { cleaned: 0 };
    }

    console.log(`Found ${stuckAnalyses.length} stuck analyses to clean up`);

    // Mark them as failed
    const { error: updateError } = await supabase
      .from('pending_analyses')
      .update({
        status: 'failed',
        error_message: 'Analysis timed out after 1 hour',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo.toISOString());

    if (updateError) {
      console.error('Failed to update stuck analyses:', updateError);
      return { cleaned: 0, error: updateError.message };
    }

    console.log(`Successfully cleaned up ${stuckAnalyses.length} stuck analyses`);
    return { cleaned: stuckAnalyses.length };

  } catch (error: any) {
    console.error('Cleanup failed:', error);
    return { cleaned: 0, error: error.message };
  }
};

export const getAnalysisAge = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  return now.getTime() - created.getTime();
};

export const isAnalysisStuck = (analysis: { created_at: string; status: string }): boolean => {
  const ageMs = getAnalysisAge(analysis.created_at);
  const oneHourMs = 60 * 60 * 1000;
  
  return analysis.status === 'pending' && ageMs > oneHourMs;
};
