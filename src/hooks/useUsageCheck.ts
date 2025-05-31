
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useUsageCheck = () => {
  const navigate = useNavigate();

  const checkUsageLimits = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
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

      if (currentUsage && currentUsage.usage_count >= 2) {
        toast.error("Daily limit reached. Upgrade to Pro for unlimited access.");
        navigate("/billing");
        return false;
      }
    }

    return { userData, currentUsage };
  };

  const updateUsageLog = async (userId: string, currentUsage: any) => {
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('api_usage_log')
      .upsert({
        user_id: userId,
        usage_date: today,
        usage_count: (currentUsage?.usage_count || 0) + 1
      });
  };

  return { checkUsageLimits, updateUsageLog };
};
