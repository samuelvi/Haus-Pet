/**
 * TanStack Query Configuration
 * Manages client-side caching, synchronization, and persistence
 */

import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';

/**
 * Create a persister that uses IndexedDB via idb-keyval
 * This provides better performance and capacity than localStorage
 */
export const persister = {
  persistClient: async (client: any) => {
    await set('REACT_QUERY_OFFLINE_CACHE', client);
  },
  restoreClient: async () => {
    return await get('REACT_QUERY_OFFLINE_CACHE');
  },
  removeClient: async () => {
    await del('REACT_QUERY_OFFLINE_CACHE');
  },
};

/**
 * Query Client with optimized defaults for offline-first architecture
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - how long unused data stays in cache
      staleTime: 1000 * 60 * 5, // 5 minutes - how long data is considered fresh

      // Retry configuration
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch configuration
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet connection is restored
      refetchOnMount: true, // Refetch when component mounts

      // Network mode
      networkMode: 'offlineFirst', // Try cache first, then network
    },
    mutations: {
      // Retry configuration for mutations
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst', // Queue mutations when offline
    },
  },
});

/**
 * Persist options for the query client
 */
export const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: '1', // Increment this to invalidate all cached data
};
