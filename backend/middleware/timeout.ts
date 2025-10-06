import type { Context, Next } from 'hono';
import { logger } from '../logging/pino';

/**
 * Request timeout middleware for Hono
 * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * import { timeoutMiddleware } from '@/backend/middleware/timeout';
 * app.use('*', timeoutMiddleware(30000)); // 30s global timeout
 * ```
 */
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return async (c: Context, next: Next) => {
    const correlationId = c.get('correlationId') as string | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        reject(new Error('Request timeout'));
      }, timeoutMs);
    });

    try {
      await Promise.race([next(), timeoutPromise]);
      
      // Clear timeout if request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (isTimedOut || (error instanceof Error && error.message === 'Request timeout')) {
        logger.warn({
          evt: 'request_timeout',
          cat: 'http',
          corr: { correlationId },
          req: {
            method: c.req.method,
            path: c.req.path,
          },
          data: {
            timeoutMs,
          },
        }, 'Request timed out');

        c.status(408 as any);
        return c.json({
          error: 'Request timeout',
          message: `Request exceeded ${timeoutMs}ms timeout`,
        }, 408);
      }

      // Re-throw other errors
      throw error;
    }
  };
}
