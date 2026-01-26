import { backendApi } from "@/lib/api/client";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  category: string;
  supports_vision: boolean;
  is_default: boolean;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
}

export type ContentComplexity = 'simple' | 'moderate' | 'complex';
export type UserTier = 'free' | 'pro';

export class ModelSelectionService {
  private static instance: ModelSelectionService;
  private modelsCache: ModelInfo[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ModelSelectionService {
    if (!ModelSelectionService.instance) {
      ModelSelectionService.instance = new ModelSelectionService();
    }
    return ModelSelectionService.instance;
  }

  async getDefaultModel(): Promise<ModelInfo | null> {
    await this.refreshCacheIfNeeded();
    return this.modelsCache.find(model => model.is_default) || this.modelsCache[0] || null;
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    await this.refreshCacheIfNeeded();
    return this.modelsCache.filter(model => model.is_default);
  }

  // Simplified - everyone uses the same model
  async selectOptimalModel(): Promise<ModelInfo | null> {
    return await this.getDefaultModel();
  }

  async getFallbackChain(primaryModel: string): Promise<string[]> {
    await this.refreshCacheIfNeeded();
    const chain = [primaryModel];
    
    // Add other active models as fallbacks
    const fallbacks = this.modelsCache
      .filter(model => model.model_id !== primaryModel)
      .sort((a, b) => a.input_cost_per_1k_tokens - b.input_cost_per_1k_tokens)
      .map(model => model.model_id);
    
    return [...chain, ...fallbacks];
  }

  detectContentComplexity(description: string, fileUrl: string | null): ContentComplexity {
    const text = description?.toLowerCase() || '';
    
    // Complex patterns (need more careful processing)
    const complexPatterns = [
      /nutrition|calories|protein|carbs|vitamins|detailed|comprehensive|analyze/,
      /workout|exercise|fitness|training|complex|advanced/,
      /medical|health|assessment|diagnosis|clinical/
    ];
    
    // Simple patterns (straightforward processing)
    const simplePatterns = [
      /receipt|bill|invoice|purchase|simple|basic/,
      /\$\d+|\d+\.\d+|total|subtotal/,
      /walmart|target|costco|amazon/i
    ];
    
    const isPDF = fileUrl?.toLowerCase().includes('.pdf');
    const isLongText = text.length > 200;
    
    if (complexPatterns.some(pattern => pattern.test(text)) || isPDF) {
      return 'complex';
    }
    
    if (simplePatterns.some(pattern => pattern.test(text)) && !isLongText) {
      return 'simple';
    }
    
    return 'moderate';
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp > this.CACHE_TTL || this.modelsCache.length === 0) {
      await this.refreshCache();
    }
  }

  private async refreshCache(): Promise<void> {
    try {
      const { data, error } = await backendApi
        .from('models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      this.modelsCache = data || [];
      this.cacheTimestamp = Date.now();
      console.log(`Model cache refreshed with ${this.modelsCache.length} models`);
    } catch (error) {
      console.error('Failed to refresh model cache:', error);
      // Keep existing cache on error
    }
  }

  // Clear cache manually if needed
  public clearCache(): void {
    this.modelsCache = [];
    this.cacheTimestamp = 0;
  }
}

// Export singleton instance
export const modelSelectionService = ModelSelectionService.getInstance();
