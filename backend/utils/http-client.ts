import { logger } from '../logging/pino';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_OPTIONS: Required<HttpClientOptions> = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {}
};

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * HTTP client with timeout, retries, and circuit breaker pattern
 */
export class HttpClient {
  private options: Required<HttpClientOptions>;

  constructor(options: HttpClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    const requestInit: RequestInit = {
      ...init,
      signal: controller.signal,
      headers: {
        ...this.options.headers,
        ...init.headers
      }
    };

    try {
      const response = await this.retryRequest(url, requestInit);
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest(url: string, init: RequestInit): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        const response = await fetch(url, init);
        
        // Don't retry on client errors (4xx), only server errors (5xx) and network issues
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        if (attempt === this.options.retries) {
          return response; // Return the last response even if it's an error
        }
        
        logger.warn({
          evt: 'http_retry',
          cat: 'http',
          attempt: attempt + 1,
          status: response.status,
          url: this.sanitizeUrl(url)
        }, `HTTP request failed, retrying (${attempt + 1}/${this.options.retries})`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.options.retries) {
          throw lastError;
        }
        
        logger.warn({
          evt: 'http_retry',
          cat: 'http',
          attempt: attempt + 1,
          error: lastError.message,
          url: this.sanitizeUrl(url)
        }, `HTTP request failed, retrying (${attempt + 1}/${this.options.retries})`);
      }
      
      // Wait before retry with exponential backoff
      if (attempt < this.options.retries) {
        const delay = Math.min(
          this.options.retryDelay * Math.pow(2, attempt),
          10000 // Max 10 seconds
        );
        await this.sleep(delay);
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * GET request with JSON response
   */
  async get<T = any>(url: string, options: Omit<HttpClientOptions, 'headers'> & { headers?: Record<string, string> } = {}): Promise<T> {
    const response = await this.request(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
    }
    
    return response.json();
  }

  /**
   * POST request with JSON body and response
   */
  async post<T = any>(url: string, body: any, options: Omit<HttpClientOptions, 'headers'> & { headers?: Record<string, string> } = {}): Promise<T> {
    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
    }
    
    return response.json();
  }

  /**
   * POST request with FormData (for file uploads)
   */
  async postFormData<T = any>(url: string, formData: FormData, options: Omit<HttpClientOptions, 'headers'> & { headers?: Record<string, string> } = {}): Promise<T> {
    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...options.headers
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
    }
    
    return response.json();
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['api_key', 'token', 'secret', 'password', 'auth'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      return urlObj.toString();
    } catch {
      return '[INVALID_URL]';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom HTTP error class
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Circuit breaker for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error({
        evt: 'circuit_breaker_open',
        cat: 'reliability',
        failures: this.failures,
        threshold: this.failureThreshold
      }, 'Circuit breaker opened due to failures');
    }
  }

  getState(): string {
    return this.state;
  }
}

// Default HTTP client instance
export const httpClient = new HttpClient({
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
});

// Circuit breaker for external APIs
export const externalApiCircuitBreaker = new CircuitBreaker(5, 60000);