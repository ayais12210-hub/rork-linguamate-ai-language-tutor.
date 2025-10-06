import { z } from 'zod';
import { err, ok, Result } from '@/lib/errors/result';
import { AppError, createAppError } from '@/lib/errors/AppError';

export interface HttpOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export async function getJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: HttpOptions = {}
): Promise<Result<T>> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    headers = {},
    signal,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Merge abort signals if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const retryable = RETRYABLE_STATUS_CODES.includes(response.status);
      const error = createAppError(
        'NetworkError',
        `HTTP ${response.status}: ${response.statusText}`,
        {
          retryable,
          context: { status: response.status, url },
        }
      );
      return err(error);
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);
    
    if (!parsed.success) {
      const error = createAppError(
        'ValidationError',
        'Invalid server response format',
        {
          cause: parsed.error,
          context: { url, validationErrors: parsed.error.errors },
        }
      );
      return err(error);
    }

    return ok(parsed.data);
  } catch (e) {
    clearTimeout(timeoutId);
    
    if (e instanceof Error && e.name === 'AbortError') {
      const error = createAppError(
        'TimeoutError',
        'Request timed out',
        {
          retryable: true,
          context: { url, timeout },
        }
      );
      return err(error);
    }

    const error = createAppError(
      'NetworkError',
      'Network request failed',
      {
        cause: e,
        retryable: true,
        context: { url },
      }
    );
    return err(error);
  }
}

export async function postJson<T, U>(
  url: string,
  data: T,
  schema: z.ZodType<U>,
  options: HttpOptions = {}
): Promise<Result<U>> {
  const {
    timeout = 10000,
    headers = {},
    signal,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const retryable = RETRYABLE_STATUS_CODES.includes(response.status);
      const error = createAppError(
        'NetworkError',
        `HTTP ${response.status}: ${response.statusText}`,
        {
          retryable,
          context: { status: response.status, url },
        }
      );
      return err(error);
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);
    
    if (!parsed.success) {
      const error = createAppError(
        'ValidationError',
        'Invalid server response format',
        {
          cause: parsed.error,
          context: { url, validationErrors: parsed.error.errors },
        }
      );
      return err(error);
    }

    return ok(parsed.data);
  } catch (e) {
    clearTimeout(timeoutId);
    
    if (e instanceof Error && e.name === 'AbortError') {
      const error = createAppError(
        'TimeoutError',
        'Request timed out',
        {
          retryable: true,
          context: { url, timeout },
        }
      );
      return err(error);
    }

    const error = createAppError(
      'NetworkError',
      'Network request failed',
      {
        cause: e,
        retryable: true,
        context: { url },
      }
    );
    return err(error);
  }
}

export async function withRetry<T>(
  fn: () => Promise<Result<T>>,
  config: Partial<RetryConfig> = {}
): Promise<Result<T>> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    const result = await fn();
    
    if (result.ok) {
      return result;
    }

    lastError = result.error;
    
    // Don't retry if error is not retryable
    if (!result.error.retryable || attempt === retryConfig.maxRetries) {
      break;
    }

    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
      retryConfig.maxDelay
    );
    
    const jitteredDelay = retryConfig.jitter 
      ? delay + Math.random() * 1000 
      : delay;

    await new Promise(resolve => setTimeout(resolve, jitteredDelay));
  }

  return err(lastError!);
}

// Utility to create a safe fetch wrapper
export function createSafeFetch(baseUrl: string, defaultOptions: HttpOptions = {}) {
  return {
    get: <T>(endpoint: string, schema: z.ZodType<T>, options: HttpOptions = {}) =>
      getJson(`${baseUrl}${endpoint}`, schema, { ...defaultOptions, ...options }),
    
    post: <T, U>(endpoint: string, data: T, schema: z.ZodType<U>, options: HttpOptions = {}) =>
      postJson(`${baseUrl}${endpoint}`, data, schema, { ...defaultOptions, ...options }),
  };
}