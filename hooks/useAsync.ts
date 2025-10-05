// useAsync hook for standardised async operations with error handling

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, toAppError } from '@/lib/errors';

export type AsyncState<T> = 
  | { status: 'idle'; data: undefined; error: undefined; isLoading: false; isError: false; isSuccess: false }
  | { status: 'loading'; data: undefined; error: undefined; isLoading: true; isError: false; isSuccess: false }
  | { status: 'success'; data: T; error: undefined; isLoading: false; isError: false; isSuccess: true }
  | { status: 'error'; data: undefined; error: AppError; isLoading: false; isError: true; isSuccess: false };

export interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  retryCount?: number;
  resetOnUnmount?: boolean;
  showErrorToast?: boolean;
  immediate?: boolean;
}

export interface UseAsyncReturn<T> {
  state: AsyncState<T>;
  execute: (params?: unknown) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: unknown) => void;
  retry: () => Promise<T | undefined>;
}

export function useAsync<T>(
  asyncFunction: (params?: unknown) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const {
    onSuccess,
    onError,
    retryCount = 0,
    resetOnUnmount = true,
    showErrorToast = true,
    immediate = false,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: undefined,
    error: undefined,
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const mountedRef = useRef(true);
  const currentRetryRef = useRef(0);
  const lastParamsRef = useRef<unknown>();

  useEffect(() => {
    mountedRef.current = true;
    
    if (immediate) {
      execute();
    }
    
    return () => {
      mountedRef.current = false;
      if (resetOnUnmount) {
        reset();
      }
    };
  }, []);

  const execute = useCallback(async (params?: unknown): Promise<T | undefined> => {
    if (!mountedRef.current) return;

    lastParamsRef.current = params;
    currentRetryRef.current = 0;

    setState({
      status: 'loading',
      data: undefined,
      error: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
    });

    try {
      const data = await asyncFunction(params);
      
      if (!mountedRef.current) return;

      setState({
        status: 'success',
        data,
        error: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
      });

      onSuccess?.(data);
      return data;
    } catch (error) {
      if (!mountedRef.current) return;

      const appError = toAppError(error);
      
      setState({
        status: 'error',
        data: undefined,
        error: appError,
        isLoading: false,
        isError: true,
        isSuccess: false,
      });

      onError?.(appError);

      // Show error toast if enabled and error is user-facing
      if (showErrorToast && appError.isRecoverable) {
        // In a real implementation, this would use a toast library
        console.error('[useAsync] Error:', appError.getUserMessage());
      }

      // Auto-retry if configured and error is recoverable
      if (currentRetryRef.current < retryCount && appError.isRecoverable) {
        currentRetryRef.current++;
        setTimeout(() => {
          if (mountedRef.current) {
            execute(params);
          }
        }, Math.min(1000 * Math.pow(2, currentRetryRef.current), 10000));
      }
    }
  }, [asyncFunction, onSuccess, onError, showErrorToast, retryCount]);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;

    setState({
      status: 'idle',
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
    currentRetryRef.current = 0;
  }, []);

  const setData = useCallback((data: T) => {
    if (!mountedRef.current) return;

    setState({
      status: 'success',
      data,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
    });
  }, []);

  const setError = useCallback((error: unknown) => {
    if (!mountedRef.current) return;

    const appError = toAppError(error);
    setState({
      status: 'error',
      data: undefined,
      error: appError,
      isLoading: false,
      isError: true,
      isSuccess: false,
    });
  }, []);

  const retry = useCallback(async (): Promise<T | undefined> => {
    currentRetryRef.current = 0;
    return execute(lastParamsRef.current);
  }, [execute]);

  return {
    state,
    execute,
    reset,
    setData,
    setError,
    retry,
  };
}

// Variant for manual execution only
export function useLazyAsync<T>(
  asyncFunction: (params?: unknown) => Promise<T>,
  options: Omit<UseAsyncOptions<T>, 'immediate'> = {}
): UseAsyncReturn<T> {
  return useAsync(asyncFunction, { ...options, immediate: false });
}

// Variant for immediate execution
export function useAsyncEffect<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  options: Omit<UseAsyncOptions<T>, 'immediate'> = {}
): Omit<UseAsyncReturn<T>, 'execute'> {
  const { state, reset, setData, setError, retry } = useAsync(asyncFunction, {
    ...options,
    immediate: false,
  });

  useEffect(() => {
    let cancelled = false;

    const executeAsync = async () => {
      if (cancelled) return;
      
      setState({
        status: 'loading',
        data: undefined,
        error: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
      });

      try {
        const data = await asyncFunction();
        if (!cancelled) {
          setData(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error);
        }
      }
    };

    executeAsync();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { state, reset, setData, setError, retry };
}

// Helper hook for handling loading states
export function useAsyncState<T>(initialData?: T): UseAsyncReturn<T> {
  const noop = useCallback(async () => initialData as T, [initialData]);
  return useAsync(noop, { immediate: false });
}