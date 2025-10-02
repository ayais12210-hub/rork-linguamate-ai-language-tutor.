import { useState, useEffect, useRef, useCallback } from 'react';

interface AsyncValidateOptions<T> {
  debounceMs?: number;
  validateFn: (value: T) => Promise<boolean | string>;
  enabled?: boolean;
}

interface AsyncValidateResult {
  isValidating: boolean;
  error: string | null;
  isValid: boolean | null;
}

export function useAsyncValidate<T>(
  value: T,
  options: AsyncValidateOptions<T>
): AsyncValidateResult {
  const { debounceMs = 500, validateFn, enabled = true } = options;
  
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback(async (val: T) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateFn(val);
      
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (typeof result === 'string') {
        setError(result);
        setIsValid(false);
      } else {
        setIsValid(result);
        setError(result ? null : 'Validation failed');
      }
    } catch (err) {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }
      
      console.warn('Async validation failed:', err);
      setError(null);
      setIsValid(null);
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsValidating(false);
      }
    }
  }, [validateFn]);

  useEffect(() => {
    if (!enabled) {
      setIsValidating(false);
      setError(null);
      setIsValid(null);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      validate(value);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, enabled, debounceMs, validate]);

  return { isValidating, error, isValid };
}
