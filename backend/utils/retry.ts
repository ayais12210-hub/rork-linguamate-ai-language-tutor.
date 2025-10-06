import { logger } from '../logging/pino';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

/**
 * Default retry predicate - retry on network and timeout errors
 */
const defaultShouldRetry = (error: any): boolean => {
  // Retry on network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // Retry on 5xx errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Retry on 429 (rate limit)
  if (error.status === 429) {
    return true;
  }
  
  // Don't retry on client errors
  return false;
};

/**
 * Exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter (0-25% of delay)
  const jitter = clampedDelay * 0.25 * Math.random();
  
  return Math.round(clampedDelay + jitter);
}

/**
 * Retry a function with exponential backoff
 * 
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetch('https://api.example.com/data'),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt) => {
 *       logger.warn(`Retry attempt ${attempt} after error: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier);
      
      // Log retry
      logger.warn({
        evt: 'retry_attempt',
        cat: 'resilience',
        data: {
          attempt,
          maxAttempts,
          delay,
          errorCode: (error as any).code,
          errorMessage: (error as any).message,
        },
      }, `Retrying after error (attempt ${attempt}/${maxAttempts})`);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry decorator for class methods
 * 
 * @example
 * ```ts
 * class ApiClient {
 *   @Retry({ maxAttempts: 3 })
 *   async fetchData() {
 *     return fetch('https://api.example.com/data');
 *   }
 * }
 * ```
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return retry(
        () => originalMethod.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
}

/**
 * Create a retry policy that can be reused
 */
export class RetryPolicy {
  constructor(private readonly options: RetryOptions) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return retry(fn, this.options);
  }
  
  /**
   * Create a new policy with modified options
   */
  with(overrides: Partial<RetryOptions>): RetryPolicy {
    return new RetryPolicy({ ...this.options, ...overrides });
  }
}

// Common retry policies
export const RetryPolicies = {
  /**
   * Fast retry for quick operations
   */
  fast: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
  }),
  
  /**
   * Standard retry for most operations
   */
  standard: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }),
  
  /**
   * Aggressive retry for critical operations
   */
  aggressive: new RetryPolicy({
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
  }),
  
  /**
   * No retry
   */
  none: new RetryPolicy({
    maxAttempts: 1,
  }),
};