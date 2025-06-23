import { supabase } from "@/integrations/supabase/client";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  category: string;
  supports_vision: boolean;
  is_default: boolean;
  required_subscription_tier: string;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
}

export type ContentComplexity = 'simple' | 'moderate' | 'complex';
export type UserTier = 'free' | 'pro' | 'enterprise';

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

  async getAvailableModels(userTier: UserTier = 'free'): Promise<ModelInfo[]> {
    await this.refreshCacheIfNeeded();
    
    return this.modelsCache.filter(model => {
      if (userTier === 'free') return model.required_subscription_tier === 'free';
      if (userTier === 'pro') return ['free', 'pro'].includes(model.required_subscription_tier);
      if (userTier === 'enterprise') return ['free', 'pro', 'enterprise'].includes(model.required_subscription_tier);
      return false;
    });
  }

  async getDefaultModel(userTier: UserTier = 'free'): Promise<ModelInfo | null> {
    const availableModels = await this.getAvailableModels(userTier);
    return availableModels.find(model => model.is_default) || availableModels[0] || null;
  }

  async selectOptimalModel(
    userTier: UserTier,
    complexity: ContentComplexity,
    category?: string,
    requiresVision?: boolean
  ): Promise<ModelInfo | null> {
    const availableModels = await this.getAvailableModels(userTier);
    
    // Filter by vision requirement if specified
    const visionFiltered = requiresVision 
      ? availableModels.filter(model => model.supports_vision)
      : availableModels;

    if (visionFiltered.length === 0) return null;

    // Smart model selection based on complexity and tier
    switch (complexity) {
      case 'simple':
        // For simple tasks, prefer efficient models
        return this.findModelByCategory(visionFiltered, 'efficient') ||
               this.findModelByCategory(visionFiltered, 'general') ||
               visionFiltered[0];

      case 'moderate':
        // For moderate tasks, prefer powerful or general models
        return this.findModelByCategory(visionFiltered, 'powerful') ||
               this.findModelByCategory(visionFiltered, 'general') ||
               visionFiltered[0];

      case 'complex':
        // For complex tasks, prefer flagship or reasoning models
        return this.findModelByCategory(visionFiltered, 'flagship') ||
               this.findModelByCategory(visionFiltered, 'reasoning') ||
               this.findModelByCategory(visionFiltered, 'powerful') ||
               visionFiltered[0];

      default:
        return visionFiltered.find(model => model.is_default) || visionFiltered[0];
    }
  }

  async getFallbackChain(userTier: UserTier, primaryModel: string): Promise<string[]> {
    const availableModels = await this.getAvailableModels(userTier);
    const chain = [primaryModel];
    
    // Add efficient models as fallbacks
    const fallbacks = availableModels
      .filter(model => model.model_id !== primaryModel)
      .sort((a, b) => a.input_cost_per_1k_tokens - b.input_cost_per_1k_tokens)
      .map(model => model.model_id);
    
    return [...chain, ...fallbacks];
  }

  detectContentComplexity(description: string, fileUrl: string | null): ContentComplexity {
    const text = description?.toLowerCase() || '';
    
    // Complex patterns (need powerful models)
    const complexPatterns = [
      /nutrition|calories|protein|carbs|vitamins|detailed|comprehensive|analyze/,
      /workout|exercise|fitness|training|complex|advanced/,
      /medical|health|assessment|diagnosis|clinical/
    ];
    
    // Simple patterns (can use cheaper models)
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
      const { data, error } = await supabase
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

  private findModelByCategory(models: ModelInfo[], category: string): ModelInfo | null {
    return models.find(model => model.category === category) || null;
  }

  // Clear cache manually if needed
  public clearCache(): void {
    this.modelsCache = [];
    this.cacheTimestamp = 0;
  }
}

// Export singleton instance
export const modelSelectionService = ModelSelectionService.getInstance();
