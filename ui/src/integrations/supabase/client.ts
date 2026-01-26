// Backend API Client (replaces Supabase)
// Import the backend API client like this:
// import { supabase } from "@/integrations/supabase/client";

import { backendApi } from '@/lib/api/client';

// Export as 'supabase' to maintain compatibility with existing code
export const supabase = backendApi;