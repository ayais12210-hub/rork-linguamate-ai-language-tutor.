import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, toAppError } from '@/lib/errors';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data?: T;
  error?: AppError;
}

export function useAsync<T>(options?: { autoResetMs?: number }) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleAutoReset = useCallback(() => {
    if (!options?.autoResetMs) return;
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(
      () => setState({ status: 'idle' }),
      options.autoResetMs
    );
  }, [options?.autoResetMs]);

  const run = useCallback(
    async (fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: 'loading' });
      try {
        const result = await fn(controller.signal);
        setState({ status: 'success', data: result });
        scheduleAutoReset();
        return result;
      } catch (e) {
        const appErr = toAppError(e);
        setState({ status: 'error', error: appErr });
        scheduleAutoReset();
        return undefined;
      } finally {
        abortRef.current = null;
      }
    },
    [scheduleAutoReset]
  );

  const reset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    setState({ status: 'idle' });
  }, []);

  // Clean up any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  return { ...state, run, reset };
}
