import type { Context, Next } from 'hono';
import { logger } from '../logging/pino';

export interface TimeoutOptions {
  ms?: number;
  message?: string;
}

/**
 * Request timeout middleware
 * Ensures requests don't hang indefinitely
 * 
 * @param options - Timeout configuration
 * @param options.ms - Timeout in milliseconds (default: 30000)
 * @param options.message - Custom timeout message
 * 
 * @example
 * ```ts
 * app.use('/api/slow-endpoint', timeout({ ms: 60000 }));
 * ```
 */
export function timeout({ ms = 30000, message = 'Request timeout' }: TimeoutOptions = {}) {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, ms);
    
    const correlationId = c.get('correlationId') || 'unknown';
    const startTime = Date.now();
    
    try {
      // Create a promise that rejects on timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(message));
        });
      });
      
      // Race between the actual handler and timeout
      await Promise.race([
        next(),
        timeoutPromise,
      ]);
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (controller.signal.aborted) {
        const duration = Date.now() - startTime;
        
        logger.warn({
          evt: 'request_timeout',
          cat: 'performance',
          req: {
            method: c.req.method,
            path: c.req.path,
            url: c.req.url,
          },
          corr: { correlationId },
          perf: {
            duration,
            timeout: ms,
          },
        }, `Request timed out after ${duration}ms`);
        
        c.status(408); // Request Timeout
        return c.json({
          error: 'Request Timeout',
          message: `The request exceeded the ${ms}ms timeout limit`,
          correlationId,
        });
      }
      
      // Re-throw if not a timeout error
      throw error;
    }
  };
}

/**
 * Creates a timeout wrapper for async functions
 * Useful for external API calls
 * 
 * @example
 * ```ts
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   5000,
 *   'External API timeout'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}