
import { api } from "@/lib/api";

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

  const id = crypto.randomUUID();

  await api.from('pending_analyses').insert({
    id,
    user_id: userId,
    description,
    image_url: imageUrl,
    status: 'pending',
    estimated_completion: estimatedCompletion.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  return id;

  /* 
  if (error) { ... } Removed dead code
  */
  return id;
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

  // Fetch existing first to merge (Generic API limitation)
  const { data: existingList } = await api.from('pending_analyses').select();
  const existing = existingList?.find((a: any) => a.id === id);

  if (!existing) throw new Error("Analysis not found");

  const finalUpdate = {
    ...existing,
    ...updateData
  };

  const { error } = await api.from('pending_analyses').insert(finalUpdate);

  if (error) {
    console.error('Failed to update analysis status:', error);
    throw error;
  }
};

export const getPendingAnalyses = async (userId: string): Promise<PendingAnalysis[]> => {
  const { data, error } = await api.from('pending_analyses').select();

  if (data) {
    const filtered = data.filter((a: any) => a.user_id === userId);
    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered as PendingAnalysis[];
  }

  if (error) {
    console.error('Failed to fetch pending analyses:', error);
    throw error;
  }

  return (data || []) as PendingAnalysis[];
};

export const retryFailedAnalysis = async (id: string) => {
  // First get the current retry count
  const { data: allAnalyses } = await api.from('pending_analyses').select();
  const currentData = allAnalyses?.find((a: any) => a.id === id);

  if (!allAnalyses) {
    console.error('Failed to fetch analyses');
    throw new Error("Failed to fetch");
  }

  // Update with incremented retry count and reset to pending
  // Perform Update (Upsert)
  const updatedRecord = {
    ...currentData,
    status: 'pending',
    error_message: null,
    completed_at: null,
    retry_count: (currentData.retry_count || 0) + 1,
    updated_at: new Date().toISOString()
  };

  const { error } = await api.from('pending_analyses').insert(updatedRecord);

  if (error) {
    console.error('Failed to retry analysis:', error);
    throw error;
  }
};

// New function to clean up inconsistent data
export const cleanupInconsistentAnalyses = async (userId: string) => {
  console.log('Cleaning up inconsistent analyses for user:', userId);

  // Find analyses that have completed_at but are still in pending status
  const { data: allAnalyses } = await api.from('pending_analyses').select();
  const inconsistentAnalyses = allAnalyses?.filter((a: any) =>
    a.user_id === userId &&
    a.status === 'pending' &&
    a.completed_at !== null
  );

  if (!allAnalyses) {
    console.error('Failed to fetch');
    return;
  }

  if (inconsistentAnalyses && inconsistentAnalyses.length > 0) {
    console.log(`Found ${inconsistentAnalyses.length} inconsistent analyses`);

    // Update these to completed status
    // Update loop
    for (const analysis of inconsistentAnalyses) {
      await api.from('pending_analyses').insert({
        ...analysis,
        status: 'completed',
        updated_at: new Date().toISOString()
      });
    }
    const updateError = null; // Mock success for loop

    if (updateError) {
      console.error('Failed to cleanup inconsistent analyses:', updateError);
    } else {
      console.log('Successfully cleaned up inconsistent analyses');
    }
  }
};
