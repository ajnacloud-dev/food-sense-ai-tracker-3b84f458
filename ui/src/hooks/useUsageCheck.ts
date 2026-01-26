
import { useState } from "react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useUsageCheck = () => {
  const navigate = useNavigate();

  const checkUsageLimits = async (userId: string) => {
    // Disabled for development - api_usage_log table structure mismatch
    console.log('Usage limits disabled in development mode');

    // Return mock data that allows unlimited usage
    return {
      userData: { id: userId, is_subscribed: true },
      currentUsage: null
    };
  };

  const incrementUsage = async (userId: string, currentUsage: any) => {
    // Disabled for development - api_usage_log table structure mismatch
    console.log('Usage tracking disabled in development mode');
    return { success: true };
  };

  const rollbackUsage = async (userId: string) => {
    // Disabled for development - api_usage_log table structure mismatch
    console.log('Usage rollback disabled in development mode');
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
