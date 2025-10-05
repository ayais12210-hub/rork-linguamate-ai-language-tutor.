// Retry utility with exponential backoff and jitter

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelay: 300,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
  retryCondition: (error: unknown) => {
    // Default: retry on network errors and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || 
          message.includes('timeout') ||
          message.includes('fetch')) {
        return true;
      }
    }
    
    // Check for HTTP status codes
    const status = (error as any)?.status;
    if (status >= 500 && status < 600) {
      return true;
    }
    
    // Check for timeout errors
    if ((error as any)?.code === 'TIMEOUT' || 
        (error as any)?.code === 'ECONNABORTED') {
      return true;
    }
    
    return false;
  },
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  factor: number,
  jitter: boolean
): number {
  // Exponential backoff
  let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
  
  // Add full jitter if enabled
  if (jitter) {
    delay = Math.random() * delay;
  }
  
  return Math.round(delay);
}

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.retryCondition(error, attempt)) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.baseDelay,
        opts.maxDelay,
        opts.factor,
        opts.jitter
      );
      
      // Call retry callback
      opts.onRetry(error, attempt, delay);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript doesn't know that
  throw lastError;
}

/**
 * Create a retry wrapper with preset options
 */
export function createRetryWrapper(defaultOptions?: RetryOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions): Promise<T> => {
    return retry(fn, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Retry wrapper for idempotent operations only
 */
export const retryIdempotent = createRetryWrapper({
  retryCondition: (error: unknown, attempt: number) => {
    // Only retry network errors for idempotent operations
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('abort')
      );
    }
    
    const status = (error as any)?.status;
    return status >= 500 && status < 600;
  },
});

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...options,
    };
  }
  
  async execute(): Promise<T> {
    const now = Date.now();
    
    // Reset failures if monitoring period has passed
    if (now - this.lastFailureTime > this.options.monitoringPeriod!) {
      this.failures = 0;
    }
    
    // Check if circuit should be reset
    if (this.state === 'open' && now - this.lastFailureTime > this.options.resetTimeout!) {
      this.state = 'half-open';
    }
    
    // Reject if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open - too many failures');
    }
    
    try {
      const result = await this.fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = now;
      
      // Open circuit if threshold reached
      if (this.failures >= this.options.failureThreshold!) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
  
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}