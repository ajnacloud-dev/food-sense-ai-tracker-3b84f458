
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  food_items: any[];
}

interface UseFoodEntriesOptions {
  selectedParticipantId: string | null;
  hasPermission: (category: string) => boolean;
  permissionLoading: boolean;
}

export const useFoodEntries = ({
  selectedParticipantId,
  hasPermission,
  permissionLoading
}: UseFoodEntriesOptions) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchingRef = useRef(false);

  const fetchFoodEntries = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (fetchingRef.current && !forceRefresh) {
      console.log('useFoodEntries: Request already in progress, skipping...');
      return;
    }

    // Check prerequisites
    if (!selectedParticipantId) {
      console.log('useFoodEntries: No participant selected');
      setLoading(false);
      return;
    }

    if (permissionLoading) {
      console.log('useFoodEntries: Still loading permissions...');
      return;
    }

    if (!hasPermission('food_entries')) {
      console.log('useFoodEntries: No permission to view food entries');
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('useFoodEntries: Fetching food entries for participant:', selectedParticipantId);

      console.log('useFoodEntries: Fetching food entries for participant:', selectedParticipantId);

      const { data: foodData, error: foodError } = await api.from('food_entries').select();
      // .eq('user_id', selectedParticipantId) // Generic API filters by user_id automatically
      // .order('created_at', { ascending: false }); // Generic API sorts by created_at automatically

      if (foodError) {
        console.error('useFoodEntries: Error fetching food entries:', foodError);
        if (foodError.message.includes('policy')) {
          toast.error('Access denied. Participant needs to grant permissions.');
        } else {
          throw foodError;
        }
        return;
      }

      console.log('useFoodEntries: Successfully fetched food entries:', foodData?.length || 0);
      setFoodEntries(foodData || []);
    } catch (error) {
      console.error('useFoodEntries: Error:', error);
      toast.error("Failed to load food entries");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedParticipantId, hasPermission, permissionLoading]);

  // Main effect for fetching data when conditions are met
  useEffect(() => {
    // Only fetch if we have all required data and permissions are loaded
    if (selectedParticipantId && !permissionLoading && hasPermission('food_entries')) {
      fetchFoodEntries();
    } else if (!permissionLoading) {
      // If permissions are loaded but we don't have access, stop loading
      setLoading(false);
    }
  }, [selectedParticipantId, permissionLoading, hasPermission]);

  const handleRefresh = async () => {
    await fetchFoodEntries(true);
    toast.success("Food entries refreshed");
  };

  return {
    foodEntries,
    loading,
    refreshing,
    handleRefresh
  };
};
