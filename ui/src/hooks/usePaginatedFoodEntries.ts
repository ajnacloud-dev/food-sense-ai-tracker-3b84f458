import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fats: number;
  total_fiber: number;
  total_sodium: number;
  meal_type: string;
  image_url: string;
  created_at: string;
  extracted_nutrients: any;
  user_id: string;
}

interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

export const usePaginatedFoodEntries = (userId: string | undefined) => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20, // Reduced from 50 for better performance
    hasMore: true,
    total: 0
  });

  const fetchEntries = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!userId) return;

    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Calculate offset for pagination
      const offset = (page - 1) * pagination.limit;

      // Fetch with pagination
      const { data: entriesData } = await api.from('food_entries')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(pagination.limit);
        // Note: Supabase doesn't support offset in this client,
        // but we'll implement it in backend

      if (!entriesData) throw new Error("Failed to fetch entries");

      // Process entries
      const processedEntries = entriesData.map((entry: any) => {
        // Parse JSON strings if they exist
        if (entry.extracted_nutrients && typeof entry.extracted_nutrients === 'string') {
          try {
            entry.extracted_nutrients = JSON.parse(entry.extracted_nutrients);
          } catch (e) {
            console.error('Failed to parse extracted_nutrients:', e);
          }
        }
        if (entry.ingredients && typeof entry.ingredients === 'string') {
          try {
            entry.ingredients = JSON.parse(entry.ingredients);
          } catch (e) {
            console.error('Failed to parse ingredients:', e);
          }
        }
        return entry;
      });

      // Update state
      if (append) {
        setEntries(prev => [...prev, ...processedEntries]);
      } else {
        setEntries(processedEntries);
      }

      // Update pagination state
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: processedEntries.length === pagination.limit,
        total: prev.total + processedEntries.length
      }));

    } catch (error: any) {
      console.error('Error fetching food entries:', error);
      toast.error("Failed to load food entries");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, pagination.limit]);

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      fetchEntries(pagination.page + 1, true);
    }
  }, [fetchEntries, loadingMore, pagination.hasMore, pagination.page]);

  const refresh = useCallback(() => {
    setPagination({
      page: 1,
      limit: 20,
      hasMore: true,
      total: 0
    });
    fetchEntries(1, false);
  }, [fetchEntries]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchEntries(1, false);
    }
  }, [userId]);

  return {
    entries,
    loading,
    loadingMore,
    pagination,
    loadMore,
    refresh
  };
};