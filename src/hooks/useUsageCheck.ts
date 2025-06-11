
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useUsageCheck = () => {
  const navigate = useNavigate();

  const checkUsageLimits = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Checking usage limits for user:', userId, 'date:', today);
    
    const { data: userData } = await supabase
      .from('users')
      .select('is_subscribed')
      .eq('id', userId)
      .single();

    let currentUsage = null;
    if (!userData?.is_subscribed) {
      const { data: usageData } = await supabase
        .from('api_usage_log')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single();

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
    
    const { data, error } = await supabase
      .from('api_usage_log')
      .upsert({
        user_id: userId,
        usage_date: today,
        usage_count: newCount
      })
      .select()
      .single();

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
    
    const { data: currentData } = await supabase
      .from('api_usage_log')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (currentData && currentData.usage_count > 0) {
      const { error } = await supabase
        .from('api_usage_log')
        .update({ usage_count: currentData.usage_count - 1 })
        .eq('user_id', userId)
        .eq('usage_date', today);

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
