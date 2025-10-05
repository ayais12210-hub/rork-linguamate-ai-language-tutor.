// Enhanced HTTP client with retries, timeouts, and Zod validation

import { z } from 'zod';
import { AppError, toAppError, createNetworkError, createServerError, createValidationError } from './errors';
import { retry, retryIdempotent } from '@/scripts/retry';
import { Platform } from 'react-native';

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  validateResponse?: boolean;
}

export interface RequestOptions<T = unknown> extends RequestInit {
  timeout?: number;
  retries?: number;
  schema?: z.ZodSchema<T>;
  requestId?: string;
  retryIdempotent?: boolean;
}

export class HttpClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private validateResponse: boolean;

  constructor(options: HttpClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultTimeout = options.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': `Linguamate/${Platform.OS}`,
      ...options.headers,
    };
    this.defaultRetries = options.retries || 3;
    this.defaultRetryDelay = options.retryDelay || 300;
    this.validateResponse = options.validateResponse ?? true;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createAbortController(timeout: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    return { controller, timeoutId };
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text();
    } else {
      return response.blob();
    }
  }

  private validateWithSchema<T>(data: unknown, schema: z.ZodSchema<T>, requestId: string): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw createValidationError('Response validation failed', {
        code: 'RESPONSE_VALIDATION_ERROR',
        details: { issues },
        requestId,
        userMessage: 'Received invalid data from server',
      });
    }
    
    return result.data;
  }

  async request<T = unknown>(
    url: string,
    options: RequestOptions<T> = {}
  ): Promise<T> {
    const requestId = options.requestId || this.generateRequestId();
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;
    const fullUrl = this.baseURL ? new URL(url, this.baseURL).toString() : url;

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
        'X-Request-ID': requestId,
      },
    };

    // Stringify body if it's an object
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    const executeRequest = async (): Promise<T> => {
      const { controller, timeoutId } = this.createAbortController(timeout);
      
      try {
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for HTML responses (likely error pages)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html') && this.validateResponse) {
          throw createNetworkError('Received HTML instead of expected API response', {
            code: 'INVALID_RESPONSE_TYPE',
            requestId,
            details: { url: fullUrl, contentType },
          });
        }

        // Handle non-2xx responses
        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await this.parseResponse(response);
          } catch {
            // Ignore parse errors for error responses
          }

          const errorCode = errorData.code || `HTTP_${response.status}`;
          const errorMessage = errorData.message || response.statusText || `HTTP ${response.status} error`;

          // Map HTTP status to AppError kind
          if (response.status === 401 || response.status === 403) {
            throw new AppError({
              kind: 'Auth',
              message: errorMessage,
              code: errorCode,
              requestId,
              details: { status: response.status, data: errorData },
            });
          } else if (response.status === 400 || response.status === 422) {
            throw new AppError({
              kind: 'Validation',
              message: errorMessage,
              code: errorCode,
              requestId,
              details: { status: response.status, data: errorData },
            });
          } else if (response.status >= 500) {
            throw createServerError(errorMessage, {
              code: errorCode,
              requestId,
              details: { status: response.status, data: errorData },
            });
          } else {
            throw createNetworkError(errorMessage, {
              code: errorCode,
              requestId,
              details: { status: response.status, data: errorData },
            });
          }
        }

        // Parse response
        const data = await this.parseResponse(response);

        // Validate with schema if provided
        if (options.schema && this.validateResponse) {
          return this.validateWithSchema(data, options.schema, requestId);
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw createNetworkError(`Request timeout after ${timeout}ms`, {
            code: 'TIMEOUT',
            requestId,
            details: { url: fullUrl, timeout },
          });
        }

        // Re-throw AppErrors
        if (error instanceof AppError) {
          throw error;
        }

        // Convert other errors
        throw toAppError(error);
      }
    };

    // Use retry wrapper
    if (options.retryIdempotent || (options.method || 'GET') === 'GET') {
      return retryIdempotent(executeRequest, {
        maxRetries: retries,
        onRetry: (error, attempt, delay) => {
          console.log(`[HTTP] Retry attempt ${attempt} after ${delay}ms for ${fullUrl}`, error);
        },
      });
    } else {
      return retry(executeRequest, {
        maxRetries: retries,
        retryCondition: (error) => {
          // Only retry network errors for non-idempotent operations
          if (error instanceof AppError) {
            return error.kind === 'Network' || (error.kind === 'Server' && error.code?.startsWith('5'));
          }
          return false;
        },
        onRetry: (error, attempt, delay) => {
          console.log(`[HTTP] Retry attempt ${attempt} after ${delay}ms for ${fullUrl}`, error);
        },
      });
    }
  }

  // Convenience methods
  async get<T = unknown>(url: string, options?: RequestOptions<T>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = unknown>(url: string, body?: unknown, options?: RequestOptions<T>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(url: string, body?: unknown, options?: RequestOptions<T>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T = unknown>(url: string, body?: unknown, options?: RequestOptions<T>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T = unknown>(url: string, options?: RequestOptions<T>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Create default HTTP client instance
export const httpClient = new HttpClient();

// Enhanced tRPC fetch wrapper with error handling
export async function enhancedFetch(
  url: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> {
  const requestId = `trpc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timeout = 15000; // 15 seconds for tRPC calls
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'X-Request-ID': requestId,
      },
    });
    
    clearTimeout(timeoutId);
    
    // Check for HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw createNetworkError('Backend endpoint not found', {
        code: 'ENDPOINT_NOT_FOUND',
        requestId,
        details: { url: url.toString() },
        userMessage: 'Unable to connect to server. Please try again later.',
      });
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw createNetworkError(`Request timeout after ${timeout}ms`, {
        code: 'TIMEOUT',
        requestId,
        details: { url: url.toString() },
      });
    }
    
    throw toAppError(error);
  }
}