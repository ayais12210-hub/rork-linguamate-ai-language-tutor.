/**
 * Retry Utility with Exponential Backoff and Full Jitter
 * 
 * Implements best-practice retry logic for network operations and other fallible tasks.
 * Uses full jitter to prevent thundering herd problem.
 */

import { DebugLogger } from '@/lib/debugging';

export type RetryOptions = {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Base delay in milliseconds (default: 300) */
  baseDelayMs?: number;
  
  /** Maximum delay cap in milliseconds (default: 30000 = 30s) */
  maxDelayMs?: number;
  
  /** Backoff multiplier (default: 2 for exponential) */
  factor?: number;
  
  /** Whether to use full jitter (default: true) */
  useJitter?: boolean;
  
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  
  /** Callback called before each retry attempt */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  
  /** Context for logging */
  context?: string;
};

export type RetryResult<T> = {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDuration: number;
};

/**
 * Default retry logic for network errors
 */
export function isNetworkRetryable(error: unknown): boolean {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      msg.includes('fetch')
    ) {
      return true;
    }
  }
  
  // Check for HTTP status codes
  if (typeof error === 'object' && error !== null) {
    const status = (error as { status?: number }).status;
    if (status) {
      // Retry on 429 (rate limit) and 5xx server errors
      return status === 429 || (status >= 500 && status < 600);
    }
  }
  
  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  factor: number,
  maxDelayMs: number,
  useJitter: boolean
): number {
  // Calculate exponential backoff
  const exponentialDelay = Math.min(
    baseDelayMs * Math.pow(factor, attempt),
    maxDelayMs
  );
  
  if (!useJitter) {
    return exponentialDelay;
  }
  
  // Full jitter: random value between 0 and exponentialDelay
  // This spreads out retry attempts to prevent thundering herd
  return Math.floor(Math.random() * exponentialDelay);
}

/**
 * Retry a promise-returning function with exponential backoff and jitter
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 300,
    maxDelayMs = 30000,
    factor = 2,
    useJitter = true,
    isRetryable = isNetworkRetryable,
    onRetry,
    context = 'retry',
  } = options;

  const startTime = Date.now();
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Log success if we had to retry
      if (attempt > 0) {
        const duration = Date.now() - startTime;
        await DebugLogger.info(
          'Retry',
          `${context} succeeded after ${attempt} retries`,
          { attempts: attempt, duration }
        );
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = attempt < maxRetries && isRetryable(error);
      
      if (!shouldRetry) {
        await DebugLogger.error(
          'Retry',
          `${context} failed after ${attempt} attempts (not retryable)`,
          { attempts: attempt, error: String(error) },
          error instanceof Error ? error : undefined
        );
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt, baseDelayMs, factor, maxDelayMs, useJitter);
      
      // Call retry callback
      if (onRetry) {
        try {
          onRetry(attempt + 1, delay, error);
        } catch (callbackError) {
          console.error('[Retry] onRetry callback error:', callbackError);
        }
      }
      
      // Log retry attempt
      await DebugLogger.warn(
        'Retry',
        `${context} attempt ${attempt + 1} failed, retrying in ${delay}ms`,
        {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: String(error),
        }
      );
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  const duration = Date.now() - startTime;
  await DebugLogger.error(
    'Retry',
    `${context} failed after ${maxRetries + 1} attempts`,
    {
      attempts: maxRetries + 1,
      duration,
      error: String(lastError),
    },
    lastError instanceof Error ? lastError : undefined
  );
  
  throw lastError;
}

/**
 * Retry with result tracking (doesn't throw on failure)
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const {
    maxRetries = 3,
    baseDelayMs = 300,
    maxDelayMs = 30000,
    factor = 2,
    useJitter = true,
    isRetryable = isNetworkRetryable,
    onRetry,
    context = 'retry',
  } = options;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;
      
      const shouldRetry = attempt < maxRetries && isRetryable(error);
      if (!shouldRetry) {
        break;
      }
      
      const delay = calculateDelay(attempt, baseDelayMs, factor, maxDelayMs, useJitter);
      
      if (onRetry) {
        try {
          onRetry(attempt + 1, delay, error);
        } catch (callbackError) {
          console.error('[Retry] onRetry callback error:', callbackError);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    // ...other options
  } = options;

  let lastError: unknown;
  let attemptsUsed = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attemptsUsed = attempt + 1;
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxRetries && isRetryable(error);
      if (!shouldRetry) {
        return {
          success: false,
          error,
          attempts: attemptsUsed,
          totalDuration: Date.now() - startTime,
        };
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attemptsUsed || maxRetries + 1,
    totalDuration: Date.now() - startTime,
  };
}
}

/**
 * Create a retry wrapper for a function
 * 
 * Usage:
 * const fetchWithRetry = createRetryWrapper(fetch, { maxRetries: 3 });
 * const response = await fetchWithRetry('https://api.example.com');
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retry(() => fn(...args), options);
  }) as T;
}

/**
 * Batch retry multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<RetryResult<T>>> {
  return Promise.all(
    operations.map(op => retryWithResult(op, options))
  );
}

/**
 * Circuit breaker pattern with retry
 * 
 * Prevents cascading failures by stopping retries when failure rate is too high
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private successes = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailureTime = 0;
  private nextRetryTime = 0;

  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      successThreshold?: number;
      timeout?: number;
      resetTimeout?: number;
      retryOptions?: RetryOptions;
    } = {}
  ) {}

  async execute(): Promise<T> {
    const now = Date.now();
    const {
      failureThreshold = 5,
      successThreshold = 2,
      timeout = 30000,
      resetTimeout = 60000,
      retryOptions = {},
    } = this.options;

    // Check if circuit should reset
    if (
      this.state === 'open' &&
      now - this.lastFailureTime > resetTimeout
    ) {
      this.state = 'half-open';
      this.successes = 0;
      await DebugLogger.info('CircuitBreaker', 'Circuit half-open, testing');
    }

    // Reject fast if circuit is open
    if (this.state === 'open') {
      throw new Error(
        `Circuit breaker is open. Next retry at ${new Date(this.nextRetryTime).toISOString()}`
      );
    }

    try {
      // Execute with retry
      const result = await retry(this.fn, {
        ...retryOptions,
        context: 'circuit-breaker',
      });

      // Record success
      this.successes++;
      this.failures = 0;

      // Close circuit if enough successes in half-open state
      if (this.state === 'half-open' && this.successes >= successThreshold) {
        this.state = 'closed';
        await DebugLogger.info('CircuitBreaker', 'Circuit closed');
      }

      return result;
    } catch (error) {
      // Record failure
      this.failures++;
      this.successes = 0;
      this.lastFailureTime = now;

      // Open circuit if failure threshold reached
      if (this.failures >= failureThreshold) {
        this.state = 'open';
        this.nextRetryTime = now + resetTimeout;
        await DebugLogger.error(
          'CircuitBreaker',
          `Circuit opened after ${this.failures} failures`,
          { nextRetryTime: new Date(this.nextRetryTime).toISOString() }
        );
      }

      throw error;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.nextRetryTime = 0;
  }
}
