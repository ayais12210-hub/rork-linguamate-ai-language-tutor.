// Robust HTTP client with retries, timeouts, Zod validation, and error mapping
import { z } from 'zod';
import { AppError, toAppError, isRetryableError, getRetryDelay } from './errors';
import { log } from './log';

interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateResponse?: z.ZodSchema;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition: (error: AppError) => boolean;
}

class HttpClient {
  private defaultTimeout = 10000; // 10 seconds
  private defaultRetries = 3;
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 300,
    maxDelay: 30000,
    retryCondition: isRetryableError,
  };

  // Generate request ID for tracing
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create timeout controller
  private createTimeoutController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
  }

  // Validate response with Zod schema
  private async validateResponse<T>(
    response: Response,
    schema: z.ZodSchema<T>,
    requestId: string
  ): Promise<T> {
    try {
      const data = await response.json();
      const result = schema.safeParse(data);
      
      if (!result.success) {
        log.warn('Response validation failed', {
          requestId,
          url: response.url,
          status: response.status,
          errors: result.error.errors,
        });
        
        throw new AppError({
          kind: 'Validation',
          message: 'Invalid response format from server',
          code: 'RESPONSE_VALIDATION_ERROR',
          details: result.error.errors,
          requestId,
        });
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // JSON parsing failed
      throw new AppError({
        kind: 'Validation',
        message: 'Invalid JSON response from server',
        code: 'JSON_PARSE_ERROR',
        requestId,
        cause: error,
      });
    }
  }

  // Execute request with retry logic
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    config: RetryConfig,
    requestId: string,
    url: string
  ): Promise<T> {
    let lastError: AppError;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        log.debug(`HTTP request attempt ${attempt}`, { requestId, url });
        return await requestFn();
      } catch (error) {
        const appError = toAppError(error, requestId);
        lastError = appError;
        
        log.warn(`HTTP request failed (attempt ${attempt})`, {
          requestId,
          url,
          error: appError.toJSON(),
        });
        
        // Don't retry on last attempt or non-retryable errors
        if (attempt > config.maxRetries || !config.retryCondition(appError)) {
          throw appError;
        }
        
        // Wait before retry with exponential backoff + jitter
        const delay = getRetryDelay(attempt, config.baseDelay);
        log.debug(`Retrying request after ${delay}ms`, { requestId, url, attempt });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Main request method
  async request<T = any>(
    url: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryConfig.baseDelay,
      validateResponse,
      signal,
      ...fetchOptions
    } = options;

    log.info('HTTP request started', {
      requestId,
      method: options.method || 'GET',
      url,
      timeout,
      retries,
    });

    // Create timeout controller if no signal provided
    const timeoutController = signal ? undefined : this.createTimeoutController(timeout);
    const requestSignal = signal || timeoutController?.signal;

    const retryConfig: RetryConfig = {
      ...this.defaultRetryConfig,
      maxRetries: retries,
      baseDelay: retryDelay,
    };

    const requestFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: requestSignal,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...fetchOptions.headers,
          },
        });

        // Check for HTTP errors
        if (!response.ok) {
          const errorData = await response.text().catch(() => null);
          
          throw new AppError({
            kind: response.status >= 500 ? 'Server' : 
                  response.status === 401 || response.status === 403 ? 'Auth' : 'Validation',
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: `HTTP_${response.status}`,
            details: errorData,
            requestId,
          });
        }

        // Validate response if schema provided
        if (validateResponse) {
          return await this.validateResponse(response, validateResponse, requestId);
        }

        // Return raw response data
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new AppError({
            kind: 'Network',
            message: `Request timed out after ${timeout}ms`,
            code: 'TIMEOUT_ERROR',
            requestId,
            cause: error,
          });
        }
        
        // Re-throw AppError as-is
        if (error instanceof AppError) {
          throw error;
        }
        
        // Convert other errors
        throw toAppError(error, requestId);
      } finally {
        // Clean up timeout controller
        timeoutController?.abort();
      }
    };

    try {
      const result = await this.executeWithRetry(requestFn, retryConfig, requestId, url);
      
      log.info('HTTP request completed successfully', {
        requestId,
        url,
      });
      
      return result;
    } catch (error) {
      const appError = error instanceof AppError ? error : toAppError(error, requestId);
      
      log.error('HTTP request failed', {
        requestId,
        url,
        error: appError.toJSON(),
      });
      
      throw appError;
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create singleton instance
export const httpClient = new HttpClient();

// Export for direct use
export { HttpClient };

// Utility function for quick requests with validation
export async function fetchWithValidation<T>(
  url: string,
  schema: z.ZodSchema<T>,
  options?: RequestConfig
): Promise<T> {
  return httpClient.get<T>(url, {
    ...options,
    validateResponse: schema,
  });
}

// Utility for offline-aware requests
export async function fetchWithOfflineSupport<T>(
  url: string,
  options?: RequestConfig & { cacheKey?: string }
): Promise<T> {
  // TODO: Implement offline caching logic
  // For now, just use regular request
  return httpClient.request<T>(url, options);
}

// Network status utilities
export const NetworkUtils = {
  // Check if error indicates offline state
  isOfflineError(error: AppError): boolean {
    return error.kind === 'Network' && (
      error.code === 'TIMEOUT_ERROR' ||
      error.message.includes('fetch') ||
      error.message.includes('network')
    );
  },

  // Create offline error
  createOfflineError(operation: string): AppError {
    return new AppError({
      kind: 'Network',
      message: `Cannot ${operation} while offline`,
      code: 'OFFLINE_ERROR',
    });
  },

  // Retry with exponential backoff
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = getRetryDelay(attempt, baseDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },
};