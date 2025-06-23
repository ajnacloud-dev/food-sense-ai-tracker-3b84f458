
import { useState, useEffect } from 'react';
import { modelSelectionService, ModelInfo, ContentComplexity, UserTier } from '@/services/modelSelectionService';
import { useAuth } from '@/contexts/AuthContext';

export function useModelSelection() {
  const { user } = useAuth();
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user tier (simplified - in real app this would come from subscription data)
  const getUserTier = (): UserTier => {
    // TODO: Get this from actual subscription data
    return 'free'; // Default to free for now
  };

  useEffect(() => {
    loadModels();
  }, [user]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userTier = getUserTier();
      const [models, defaultModel] = await Promise.all([
        modelSelectionService.getAvailableModels(userTier),
        modelSelectionService.getDefaultModel(userTier)
      ]);
      
      setAvailableModels(models);
      setDefaultModel(defaultModel);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load available models');
    } finally {
      setLoading(false);
    }
  };

  const selectOptimalModel = async (
    complexity: ContentComplexity,
    category?: string,
    requiresVision?: boolean
  ): Promise<ModelInfo | null> => {
    try {
      const userTier = getUserTier();
      return await modelSelectionService.selectOptimalModel(
        userTier,
        complexity,
        category,
        requiresVision
      );
    } catch (err) {
      console.error('Failed to select optimal model:', err);
      return defaultModel;
    }
  };

  const getFallbackChain = async (primaryModel: string): Promise<string[]> => {
    try {
      const userTier = getUserTier();
      return await modelSelectionService.getFallbackChain(userTier, primaryModel);
    } catch (err) {
      console.error('Failed to get fallback chain:', err);
      return [primaryModel];
    }
  };

  const detectComplexity = (description: string, fileUrl: string | null): ContentComplexity => {
    return modelSelectionService.detectContentComplexity(description, fileUrl);
  };

  return {
    availableModels,
    defaultModel,
    loading,
    error,
    selectOptimalModel,
    getFallbackChain,
    detectComplexity,
    refreshModels: loadModels
  };
}
