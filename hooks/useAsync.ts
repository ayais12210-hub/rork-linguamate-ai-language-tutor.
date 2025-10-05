import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, error: null, loading: true });

    try {
      const data = await asyncFunction();
      
      if (isMountedRef.current) {
        setState({ data, error: null, loading: false });
      }
      
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (isMountedRef.current) {
        setState({ data: null, error: errorObj, loading: false });
      }
      
      throw errorObj;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}