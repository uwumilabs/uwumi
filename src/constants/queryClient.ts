import { QueryClient } from '@tanstack/react-query';

// A module, not component state, so code outside React (the episode alerts) shares the cache
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
    },
  },
});
