import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppError, toAppError } from '@/lib/errors';

export type AsyncState<T> =
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: AppError };

export interface UseAsyncOptions<T> {
  auto?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
}

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, options: UseAsyncOptions<T> = {}) {
  const { auto = true, onSuccess, onError } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle', data: undefined, error: undefined } as const);
  const abortRef = useRef<AbortController | null>(null);
  const inflightRef = useRef(0);

  const run = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    inflightRef.current += 1;
    setState({ status: 'loading', data: undefined, error: undefined });

    try {
      const data = await fn(controller.signal);
      if (controller.signal.aborted) return;
      setState({ status: 'success', data, error: undefined } as const);
      onSuccess?.(data);
      return data;
    } catch (e) {
      if (controller.signal.aborted) return;
      const err = toAppError(e);
      setState({ status: 'error', data: undefined, error: err } as const);
      onError?.(err);
      throw err;
    } finally {
      inflightRef.current -= 1;
    }
  }, [fn, onSuccess, onError]);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState({ status: 'idle', data: undefined, error: undefined } as const);
  }, []);

  useEffect(() => {
    if (!auto) return;
    run();
    return () => abortRef.current?.abort();
  }, [auto, run]);

  const canRetry = useMemo(() => state.status === 'error', [state.status]);

  return {
    ...state,
    run,
    reset,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    canRetry,
  } as const;
}
