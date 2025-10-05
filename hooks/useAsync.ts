// Promise lifecycle hook with standardised error state management
import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, toAppError } from '@/lib/errors';
import { log } from '@/lib/log';
import { isEnabled } from '@/lib/flags';

export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncState<T> {
  state: AsyncState;
  data: T | null;
  error: AppError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncOptions {
  // Auto-execute on mount
  executeOnMount?: boolean;
  
  // Auto-retry on error
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Auto-toast errors
  showErrorToast?: boolean;
  
  // Debounce execution
  debounceMs?: number;
  
  // Reset state before new execution
  resetOnExecute?: boolean;
  
  // Custom error handler
  onError?: (error: AppError) => void;
  
  // Success callback
  onSuccess?: (data: any) => void;
  
  // Loading callback
  onLoading?: () => void;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
  cancel: () => void;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const {
    executeOnMount = false,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    showErrorToast = true,
    debounceMs = 0,
    resetOnExecute = true,
    onError,
    onSuccess,
    onLoading,
  } = options;

  const [state, setState] = useState<AsyncState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  
  const retryCountRef = useRef(0);
  const lastArgsRef = useRef<any[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const cancelledRef = useRef(false);
  const logger = log.scope('useAsync');

  // Reset state
  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setError(null);
    retryCountRef.current = 0;
    cancelledRef.current = false;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cancel current operation
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    logger.debug('Operation cancelled');
  }, [logger]);

  // Show error toast (placeholder - would integrate with your toast system)
  const showToast = useCallback((error: AppError) => {
    if (!isEnabled('error_handling_v1') || !showErrorToast) return;
    
    // TODO: Integrate with your toast/notification system
    logger.info('Would show error toast', { message: error.getUserMessage() });
  }, [showErrorToast, logger]);

  // Execute the async function
  const executeInternal = useCallback(async (...args: any[]): Promise<T | null> => {
    if (cancelledRef.current) return null;

    try {
      if (resetOnExecute) {
        setError(null);
      }
      
      setState('loading');
      onLoading?.();
      
      logger.debug('Executing async function', { args: args.length });
      
      const result = await asyncFunction(...args);
      
      if (cancelledRef.current) {
        logger.debug('Operation was cancelled, ignoring result');
        return null;
      }
      
      setState('success');
      setData(result);
      setError(null);
      retryCountRef.current = 0;
      
      logger.debug('Async function completed successfully');
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      if (cancelledRef.current) {
        logger.debug('Operation was cancelled, ignoring error');
        return null;
      }
      
      const appError = toAppError(err);
      
      logger.warn('Async function failed', {
        error: appError.toJSON(),
        retryCount: retryCountRef.current,
      });
      
      setState('error');
      setError(appError);
      setData(null);
      
      // Handle error
      onError?.(appError);
      showToast(appError);
      
      // Auto-retry logic
      if (autoRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        logger.info(`Auto-retrying (${retryCountRef.current}/${maxRetries})`, {
          delay: retryDelay,
        });
        
        setTimeout(() => {
          if (!cancelledRef.current) {
            executeInternal(...args);
          }
        }, retryDelay * retryCountRef.current);
      }
      
      return null;
    }
  }, [
    asyncFunction,
    resetOnExecute,
    onLoading,
    onSuccess,
    onError,
    showToast,
    autoRetry,
    maxRetries,
    retryDelay,
    logger,
  ]);

  // Debounced execute function
  const execute = useCallback((...args: any[]): Promise<T | null> => {
    lastArgsRef.current = args;
    cancelledRef.current = false;
    
    return new Promise((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (debounceMs > 0) {
        debounceTimerRef.current = setTimeout(async () => {
          const result = await executeInternal(...args);
          resolve(result);
        }, debounceMs);
      } else {
        executeInternal(...args).then(resolve);
      }
    });
  }, [executeInternal, debounceMs]);

  // Retry with last arguments
  const retry = useCallback(async (): Promise<T | null> => {
    retryCountRef.current = 0;
    return execute(...lastArgsRef.current);
  }, [execute]);

  // Execute on mount if requested
  useEffect(() => {
    if (executeOnMount) {
      execute();
    }
    
    return () => {
      cancel();
    };
  }, [executeOnMount]); // Only run on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Derived state
  const isIdle = state === 'idle';
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return {
    // State
    state,
    data,
    error,
    
    // Derived state
    isIdle,
    isLoading,
    isSuccess,
    isError,
    
    // Actions
    execute,
    reset,
    retry,
    cancel,
  };
}

// Specialized hooks for common patterns

// Hook for data fetching with caching
export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const asyncHook = useAsync(fetchFunction, {
    executeOnMount: true,
    autoRetry: true,
    maxRetries: 2,
    ...options,
  });

  // Re-execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      asyncHook.execute();
    }
  }, dependencies);

  return asyncHook;
}

// Hook for mutations with optimistic updates
export function useAsyncMutation<T, TArgs extends any[]>(
  mutationFunction: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions & {
    optimisticUpdate?: (args: TArgs) => T;
    rollbackUpdate?: () => void;
  } = {}
): UseAsyncReturn<T> & {
  mutate: (...args: TArgs) => Promise<T | null>;
} {
  const { optimisticUpdate, rollbackUpdate, ...asyncOptions } = options;
  
  const asyncHook = useAsync(mutationFunction, {
    showErrorToast: true,
    ...asyncOptions,
  });

  const mutate = useCallback(async (...args: TArgs): Promise<T | null> => {
    // Apply optimistic update
    if (optimisticUpdate) {
      const optimisticData = optimisticUpdate(args);
      asyncHook.reset();
      // Note: In a real implementation, you'd want to set this optimistic data
      // This would require extending the useAsync hook to support optimistic updates
    }

    try {
      const result = await asyncHook.execute(...args);
      return result;
    } catch (error) {
      // Rollback optimistic update on error
      if (rollbackUpdate) {
        rollbackUpdate();
      }
      throw error;
    }
  }, [asyncHook, optimisticUpdate, rollbackUpdate]);

  return {
    ...asyncHook,
    mutate,
  };
}

// Hook for polling data
export function useAsyncPolling<T>(
  fetchFunction: () => Promise<T>,
  interval: number,
  options: UseAsyncOptions & {
    stopOnError?: boolean;
    stopOnBackground?: boolean;
  } = {}
): UseAsyncReturn<T> & {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
} {
  const { stopOnError = true, stopOnBackground = true, ...asyncOptions } = options;
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const asyncHook = useAsync(fetchFunction, {
    executeOnMount: true,
    showErrorToast: false, // Handle errors manually for polling
    ...asyncOptions,
  });

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling
    
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      asyncHook.execute();
    }, interval);
  }, [asyncHook, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPolling(false);
  }, []);

  // Stop polling on error if requested
  useEffect(() => {
    if (stopOnError && asyncHook.isError) {
      stopPolling();
    }
  }, [asyncHook.isError, stopOnError, stopPolling]);

  // Handle app state changes for background polling
  useEffect(() => {
    if (!stopOnBackground) return;

    // TODO: Implement app state listener
    // This would listen to app state changes and stop/start polling accordingly
    
    return () => {
      stopPolling();
    };
  }, [stopOnBackground, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...asyncHook,
    startPolling,
    stopPolling,
    isPolling,
  };
}

export default useAsync;