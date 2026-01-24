
import { useState, useEffect } from 'react';
import { modelSelectionService, ModelInfo, ContentComplexity } from '@/services/modelSelectionService';

export function useModelSelection() {
  const [defaultModel, setDefaultModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultModel = await modelSelectionService.getDefaultModel();
      setDefaultModel(defaultModel);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load available models');
    } finally {
      setLoading(false);
    }
  };

  const selectOptimalModel = async (): Promise<ModelInfo | null> => {
    try {
      return await modelSelectionService.selectOptimalModel();
    } catch (err) {
      console.error('Failed to select optimal model:', err);
      return defaultModel;
    }
  };

  const getFallbackChain = async (primaryModel: string): Promise<string[]> => {
    try {
      return await modelSelectionService.getFallbackChain(primaryModel);
    } catch (err) {
      console.error('Failed to get fallback chain:', err);
      return [primaryModel];
    }
  };

  const detectComplexity = (description: string, fileUrl: string | null): ContentComplexity => {
    return modelSelectionService.detectContentComplexity(description, fileUrl);
  };

  return {
    defaultModel,
    loading,
    error,
    selectOptimalModel,
    getFallbackChain,
    detectComplexity,
    refreshModels: loadModels
  };
}
