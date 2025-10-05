import { useCallback, useRef, useState } from 'react';
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

  const run = useCallback(async (fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading' });
    try {
      const result = await fn(controller.signal);
      setState({ status: 'success', data: result });
      return result;
    } catch (e) {
      const appErr = toAppError(e);
      setState({ status: 'error', error: appErr });
      return undefined;
    } finally {
      abortRef.current = null;
      if (options?.autoResetMs) {
        const timeout = setTimeout(() => setState({ status: 'idle' }), options.autoResetMs);
        return () => clearTimeout(timeout);
      }
    }
  }, [options?.autoResetMs]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { ...state, run, reset };
}
