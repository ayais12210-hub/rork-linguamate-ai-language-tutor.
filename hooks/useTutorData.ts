import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { TutorData } from "@/lib/services/tutor-data-fetcher";

// Query keys for React Query
export const tutorDataKeys = {
  all: ['tutorData'] as const,
  cacheStats: () => [...tutorDataKeys.all, 'cacheStats'] as const,
  fetch: (url: string) => [...tutorDataKeys.all, 'fetch', url] as const,
  fetchMultiple: (urls: string[]) => [...tutorDataKeys.all, 'fetchMultiple', urls] as const,
};

// Hook for fetching single tutor data
export function useFetchTutorData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ url, options }: { 
      url: string; 
      options?: {
        useCache?: boolean;
        timeout?: number;
        validate?: boolean;
      }
    }) => {
      return trpc.tutorData.fetch.mutate({ url, options });
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tutorDataKeys.cacheStats() });
      if (data.success && data.data) {
        // Cache the successful result
        queryClient.setQueryData(
          tutorDataKeys.fetch(variables.url),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Failed to fetch tutor data:', error);
    },
  });
}

// Hook for fetching multiple tutor data sources
export function useFetchMultipleTutorData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ urls, options }: { 
      urls: string[]; 
      options?: {
        useCache?: boolean;
        timeout?: number;
        validate?: boolean;
        concurrency?: number;
      }
    }) => {
      return trpc.tutorData.fetchMultiple.mutate({ urls, options });
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tutorDataKeys.cacheStats() });
      if (data.success && data.results) {
        // Cache successful results
        data.results.forEach((result, index) => {
          if (result.data) {
            queryClient.setQueryData(
              tutorDataKeys.fetch(variables.urls[index]),
              { success: true, data: result.data, url: variables.urls[index] }
            );
          }
        });
      }
    },
    onError: (error) => {
      console.error('Failed to fetch multiple tutor data:', error);
    },
  });
}

// Hook for clearing cache
export function useClearTutorDataCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (url?: string) => {
      return trpc.tutorData.clearCache.mutate({ url });
    },
    onSuccess: () => {
      // Invalidate all tutor data queries
      queryClient.invalidateQueries({ queryKey: tutorDataKeys.all });
    },
    onError: (error) => {
      console.error('Failed to clear cache:', error);
    },
  });
}

// Hook for getting cache statistics
export function useTutorDataCacheStats() {
  return useQuery({
    queryKey: tutorDataKeys.cacheStats(),
    queryFn: () => trpc.tutorData.getCacheStats.query(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for getting cached tutor data
export function useCachedTutorData(url: string) {
  const queryClient = useQueryClient();
  
  return queryClient.getQueryData<{
    success: boolean;
    data: TutorData | null;
    url: string;
    timestamp: string;
  }>(tutorDataKeys.fetch(url));
}

// Hook for prefetching tutor data
export function usePrefetchTutorData() {
  const queryClient = useQueryClient();
  
  return {
    prefetch: async (url: string, options?: {
      useCache?: boolean;
      timeout?: number;
      validate?: boolean;
    }) => {
      try {
        const data = await trpc.tutorData.fetch.mutate({ url, options });
        if (data.success && data.data) {
          queryClient.setQueryData(tutorDataKeys.fetch(url), data);
        }
        return data;
      } catch (error) {
        console.error('Failed to prefetch tutor data:', error);
        throw error;
      }
    },
  };
}

// Utility hook for managing tutor data state
export function useTutorDataManager() {
  const fetchMutation = useFetchTutorData();
  const fetchMultipleMutation = useFetchMultipleTutorData();
  const clearCacheMutation = useClearTutorDataCache();
  const cacheStatsQuery = useTutorDataCacheStats();
  
  return {
    // Single fetch
    fetchTutorData: fetchMutation.mutate,
    isFetching: fetchMutation.isPending,
    fetchError: fetchMutation.error,
    fetchData: fetchMutation.data,
    
    // Multiple fetch
    fetchMultipleTutorData: fetchMultipleMutation.mutate,
    isFetchingMultiple: fetchMultipleMutation.isPending,
    fetchMultipleError: fetchMultipleMutation.error,
    fetchMultipleData: fetchMultipleMutation.data,
    
    // Cache management
    clearCache: clearCacheMutation.mutate,
    isClearingCache: clearCacheMutation.isPending,
    clearCacheError: clearCacheMutation.error,
    clearCacheData: clearCacheMutation.data,
    
    // Cache stats
    cacheStats: cacheStatsQuery.data,
    isCacheStatsLoading: cacheStatsQuery.isLoading,
    cacheStatsError: cacheStatsQuery.error,
    refetchCacheStats: cacheStatsQuery.refetch,
    
    // Combined loading state
    isLoading: fetchMutation.isPending || fetchMultipleMutation.isPending || clearCacheMutation.isPending,
    
    // Combined error state
    hasError: !!(fetchMutation.error || fetchMultipleMutation.error || clearCacheMutation.error),
    errors: {
      fetch: fetchMutation.error,
      fetchMultiple: fetchMultipleMutation.error,
      clearCache: clearCacheMutation.error,
      cacheStats: cacheStatsQuery.error,
    },
  };
}

// Hook for specific URL operations
export function useTutorDataForUrl(url: string) {
  const queryClient = useQueryClient();
  const fetchMutation = useFetchTutorData();
  const clearCacheMutation = useClearTutorDataCache();
  
  const cachedData = useCachedTutorData(url);
  
  return {
    data: cachedData?.data || null,
    isSuccess: cachedData?.success || false,
    timestamp: cachedData?.timestamp,
    isLoading: fetchMutation.isPending,
    error: fetchMutation.error,
    
    fetch: (options?: {
      useCache?: boolean;
      timeout?: number;
      validate?: boolean;
    }) => fetchMutation.mutate({ url, options }),
    
    clearCache: () => clearCacheMutation.mutate({ url }),
    isClearingCache: clearCacheMutation.isPending,
    clearCacheError: clearCacheMutation.error,
    
    // Check if data is fresh (less than 5 minutes old)
    isFresh: cachedData?.timestamp ? 
      (Date.now() - new Date(cachedData.timestamp).getTime()) < 5 * 60 * 1000 : 
      false,
  };
}