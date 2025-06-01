
import { supabase } from "@/integrations/supabase/client";

export interface PendingAnalysis {
  id: string;
  user_id: string;
  description: string | null;
  image_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  category: string | null;
  analysis_result: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
  retry_count: number;
}

export const createPendingAnalysis = async (
  userId: string,
  description: string,
  imageUrl: string | null
): Promise<string> => {
  const estimatedCompletion = new Date();
  estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 2); // 2 minutes estimate

  const { data, error } = await supabase
    .from('pending_analyses')
    .insert({
      user_id: userId,
      description,
      image_url: imageUrl,
      status: 'pending',
      estimated_completion: estimatedCompletion.toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create pending analysis:', error);
    throw error;
  }

  return data.id;
};

export const updateAnalysisStatus = async (
  id: string,
  status: 'processing' | 'completed' | 'failed',
  updates: Partial<PendingAnalysis> = {}
) => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    ...updates
  };

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('pending_analyses')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Failed to update analysis status:', error);
    throw error;
  }
};

export const getPendingAnalyses = async (userId: string): Promise<PendingAnalysis[]> => {
  const { data, error } = await supabase
    .from('pending_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pending analyses:', error);
    throw error;
  }

  return (data || []) as PendingAnalysis[];
};

export const retryFailedAnalysis = async (id: string) => {
  // First get the current retry count
  const { data: currentData, error: fetchError } = await supabase
    .from('pending_analyses')
    .select('retry_count')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Failed to fetch current retry count:', fetchError);
    throw fetchError;
  }

  // Update with incremented retry count
  const { error } = await supabase
    .from('pending_analyses')
    .update({
      status: 'pending',
      error_message: null,
      retry_count: (currentData.retry_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to retry analysis:', error);
    throw error;
  }
};
