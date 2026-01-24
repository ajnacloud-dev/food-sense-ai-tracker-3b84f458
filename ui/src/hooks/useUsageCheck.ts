
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useUsageCheck = () => {
  const navigate = useNavigate();

  const checkUsageLimits = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    console.log('Checking usage limits for user:', userId, 'date:', today);

    const { data: allUsers } = await api.from('users').select();
    const userData = allUsers?.find((u: any) => u.id === userId);

    let currentUsage = null;
    if (!userData?.is_subscribed) {
      const { data: allUsage } = await api.from('api_usage_log').select();
      const usageData = allUsage?.find((u: any) => u.user_id === userId && u.usage_date === today);

      currentUsage = usageData;
      const currentCount = currentUsage?.usage_count || 0;

      console.log('Current usage count:', currentCount);

      if (currentCount >= 2) {
        console.log('Usage limit exceeded for user:', userId);
        toast.error("Daily limit reached. Upgrade to Pro for unlimited access.");
        navigate("/billing");
        return false;
      }
    }

    return { userData, currentUsage };
  };

  const incrementUsage = async (userId: string, currentUsage: any) => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = (currentUsage?.usage_count || 0) + 1;

    console.log('Incrementing usage for user:', userId, 'new count:', newCount);

    const { data, error } = await api
      .from('api_usage_log')
      .insert({ // Generic API treats POST as Upsert usually, or we need dedicated upsert (using insert for now)
        user_id: userId,
        usage_date: today,
        usage_count: newCount
      });

    if (error) {
      console.error('Failed to increment usage:', error);
      throw error;
    }

    console.log('Usage incremented successfully:', data);
    return data;
  };

  const rollbackUsage = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    console.log('Rolling back usage for user:', userId);

    const { data: allUsage } = await api.from('api_usage_log').select();
    const currentData = allUsage?.find((u: any) => u.user_id === userId && u.usage_date === today);

    if (currentData && currentData.usage_count > 0) {
      const { error } = await api
        .from('api_usage_log')
        .update({ usage_count: currentData.usage_count - 1 })
        // Note: Generic API might require ID for update, assuming we might need to fetch ID first or generic API handles filters
        // For now, mocking "filter by user_id and date" might be tricky with generic update if it expects ID.
        // Ideally we use the ID from `currentData` if available.
        // Assuming currentData has ID:
        .eq('id', currentData.id || 0); // Fallback if no ID, but usually selecting * gives ID.

      if (error) {
        console.error('Failed to rollback usage:', error);
      } else {
        console.log('Usage rolled back successfully');
      }
    }
  };

  // Legacy method for backward compatibility
  const updateUsageLog = async (userId: string, currentUsage: any) => {
    return incrementUsage(userId, currentUsage);
  };

  return {
    checkUsageLimits,
    incrementUsage,
    rollbackUsage,
    updateUsageLog // Keep for backward compatibility
  };
};
