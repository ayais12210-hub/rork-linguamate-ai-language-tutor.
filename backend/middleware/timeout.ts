import type { Context, Next } from 'hono';

export interface TimeoutOptions {
  timeoutMs?: number;
  timeoutMessage?: string;
}

/**
 * Request timeout middleware for Hono
 * @param options - Configuration options
 * @param options.timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @param options.timeoutMessage - Custom timeout error message
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * app.use('/api/slow', timeout({ timeoutMs: 60_000 }));
 * ```
 */
export function timeout({ 
  timeoutMs = 30_000, 
  timeoutMessage = 'Request timeout' 
}: TimeoutOptions = {}) {
  return async (c: Context, next: Next) => {
    const timeoutId = setTimeout(() => {
      // Note: In a real implementation, you'd want to abort the request
      // This is a simplified version for demonstration
    }, timeoutMs);

    try {
      await next();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Abort controller-based timeout for external API calls
 * @param timeoutMs - Timeout in milliseconds
 * @param signal - AbortSignal to control the timeout
 * @returns AbortController for the timeout
 */
export function createTimeoutController(timeoutMs: number, signal?: AbortSignal): AbortController {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Clean up timeout if the original signal is aborted
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  return controller;
}

/**
 * Fetch with timeout wrapper
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 30_000
): Promise<Response> {
  const controller = createTimeoutController(timeoutMs, options.signal);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}