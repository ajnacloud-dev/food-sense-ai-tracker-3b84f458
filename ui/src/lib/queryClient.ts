import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: 'always',
      // Don't refetch on reconnect unless stale
      refetchOnReconnect: 'always',
      // Background refetch interval (30 seconds for active data)
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Cache keys for consistent naming
export const QUERY_KEYS = {
  // Food entries
  foodEntries: (userId: string) => ['foodEntries', userId] as const,
  foodEntry: (id: string) => ['foodEntry', id] as const,
  foodStats: (userId: string) => ['foodStats', userId] as const,

  // Analysis queue
  analysisQueue: (userId: string) => ['analysisQueue', userId] as const,

  // User data
  user: (userId: string) => ['user', userId] as const,
  userSettings: (userId: string) => ['userSettings', userId] as const,

  // Receipts
  receipts: (userId: string) => ['receipts', userId] as const,
  receipt: (id: string) => ['receipt', id] as const,
} as const;