/**
 * useAsync Hook
 * 
 * Standardized hook for managing async operations with consistent error handling,
 * loading states, and automatic cleanup.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, ErrorHandler } from '@/lib/error-handling';
import { DebugLogger } from '@/lib/debugging';

export type AsyncState<T> = 
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: AppError };

export type UseAsyncOptions<T> = {
  /** Initial data before first load */
  initialData?: T;
  
  /** Automatically execute on mount */
  executeOnMount?: boolean;
  
  /** Show toast on error (default: true) */
  showErrorToast?: boolean;
  
  /** Log errors to console/storage (default: true) */
  logErrors?: boolean;
  
  /** Retry failed operations automatically */
  autoRetry?: boolean;
  
  /** Max auto-retry attempts */
  maxRetries?: number;
  
  /** Callback on success */
  onSuccess?: (data: T) => void;
  
  /** Callback on error */
  onError?: (error: AppError) => void;
  
  /** Context for error logging */
  context?: string;
};

export type UseAsyncReturn<T, Args extends any[]> = {
  /** Current async state */
  state: AsyncState<T>;
  
  /** Shorthand for state.data */
  data: T | undefined;
  
  /** Shorthand for state.error */
  error: AppError | undefined;
  
  /** Is operation in progress */
  isLoading: boolean;
  
  /** Has operation succeeded */
  isSuccess: boolean;
  
  /** Has operation failed */
  isError: boolean;
  
  /** Is operation idle (not started) */
  isIdle: boolean;
  
  /** Execute the async operation */
  execute: (...args: Args) => Promise<T | undefined>;
  
  /** Reset to idle state */
  reset: () => void;
  
  /** Retry the last failed operation */
  retry: () => Promise<T | undefined>;
};

/**
 * Hook for managing async operations with standardized error handling
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(
 *   async (userId: string) => {
 *     return await fetchUserData(userId);
 *   },
 *   { executeOnMount: false }
 * );
 * 
 * // Later...
 * await execute(user.id);
 * ```
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const {
    initialData,
    executeOnMount = false,
    showErrorToast = true,
    logErrors = true,
    autoRetry = false,
    maxRetries = 3,
    onSuccess,
    onError,
    context = 'useAsync',
  } = options;

  const [state, setState] = useState<AsyncState<T>>(() =>
    initialData !== undefined
      ? { status: 'success', data: initialData, error: undefined }
      : { status: 'idle', data: undefined, error: undefined }
  );

  const lastArgsRef = useRef<Args | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup: abort any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      // Store args for retry
      lastArgsRef.current = args;

      // Abort previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState({ status: 'loading', data: undefined, error: undefined });

      try {
        const result = await asyncFunction(...args);

        if (!mountedRef.current) {
          return undefined;
        }

        setState({ status: 'success', data: result, error: undefined });
        retryCountRef.current = 0;

        // Call success callback
        if (onSuccess) {
          try {
            onSuccess(result);
          } catch (callbackError) {
            console.error('[useAsync] onSuccess callback error:', callbackError);
          }
        }

        await DebugLogger.debug(context, 'Async operation succeeded');

        return result;
      } catch (error) {
        if (!mountedRef.current) {
          return undefined;
        }

        // Convert to AppError
        let appError: AppError;
        if (error instanceof AppError) {
          appError = error;
        } else {
          // Use error handler to convert
          await ErrorHandler.handleError(error as Error, { action: context }, {
            showToUser: showErrorToast,
            logToConsole: logErrors,
            logToStorage: logErrors,
            attemptRecovery: false,
          });
          appError = new AppError(
            'UNKNOWN_ERROR' as any,
            (error as Error).message,
            'medium' as any,
            { action: context }
          );
        }

        setState({ status: 'error', data: undefined, error: appError });

        // Call error callback
        if (onError) {
          try {
            onError(appError);
          } catch (callbackError) {
            console.error('[useAsync] onError callback error:', callbackError);
          }
        }

        // Auto-retry if enabled
        if (autoRetry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          await DebugLogger.info(
            context,
            `Auto-retrying (${retryCountRef.current}/${maxRetries})`,
            { error: appError.message }
          );
          
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return execute(...args);
        }

        return undefined;
      }
    },
    [
      asyncFunction,
      context,
      showErrorToast,
      logErrors,
      autoRetry,
      maxRetries,
      onSuccess,
      onError,
    ]
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', data: undefined, error: undefined });
    retryCountRef.current = 0;
    lastArgsRef.current = null;
  }, []);

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (lastArgsRef.current === null) {
      await DebugLogger.warn(context, 'Cannot retry: no previous args');
      return undefined;
    }
    return execute(...(lastArgsRef.current as Args));
  }, [execute, context]);

  // Execute on mount if requested
  useEffect(() => {
    if (executeOnMount && lastArgsRef.current === null) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeOnMount]);

  return {
    state,
    data: state.status === 'success' ? state.data : undefined,
    error: state.status === 'error' ? state.error : undefined,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isIdle: state.status === 'idle',
    execute,
    reset,
    retry,
  };
}

/**
 * Hook for data fetching with automatic refresh
 * 
 * @example
 * ```tsx
 * const { data, isLoading, refresh } = useFetch(
 *   async () => await api.getUser(),
 *   { refreshInterval: 30000 }
 * );
 * ```
 */
export function useFetch<T>(
  fetchFunction: () => Promise<T>,
  options: UseAsyncOptions<T> & {
    /** Auto-refresh interval in ms */
    refreshInterval?: number;
    /** Enable/disable refresh */
    enabled?: boolean;
  } = {}
): UseAsyncReturn<T, []> & {
  refresh: () => Promise<T | undefined>;
} {
  const { refreshInterval, enabled = true, ...asyncOptions } = options;

  const asyncResult = useAsync(fetchFunction, {
    ...asyncOptions,
    executeOnMount: enabled,
  });

  // Auto-refresh at interval
  useEffect(() => {
    if (!enabled || !refreshInterval || refreshInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!asyncResult.isLoading) {
        asyncResult.execute();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, asyncResult]);

  return {
    ...asyncResult,
    refresh: asyncResult.execute,
  };
}

/**
 * Hook for mutations (POST/PUT/DELETE operations)
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutation(
 *   async (data: CreateUserData) => await api.createUser(data),
 *   {
 *     onSuccess: (user) => {
 *       toast.success('User created!');
 *       navigate(`/users/${user.id}`);
 *     }
 *   }
 * );
 * ```
 */
export function useMutation<T, Args extends any[] = any[]>(
  mutationFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  return useAsync(mutationFunction, {
    ...options,
    executeOnMount: false,
  });
}
