import type { Context, Next } from 'hono';

type Key = string;
const hits = new Map<Key, { count: number; ts: number }>();

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

/**
 * In-memory rate limiting middleware for Hono
 * @param options - Configuration options
 * @param options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param options.max - Maximum requests per window (default: 30)
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * app.use('/api/sensitive', rateLimit({ windowMs: 60_000, max: 10 }));
 * ```
 * 
 * TODO: For multi-instance deployments, swap to Upstash Redis or similar:
 * import { Ratelimit } from '@upstash/ratelimit';
 * import { Redis } from '@upstash/redis';
 */
export function rateLimit({ windowMs = 60_000, max = 30 }: RateLimitOptions = {}) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'local';
    const route = new URL(c.req.url).pathname;
    const key = `${ip}:${route}`;
    const now = Date.now();

    let rec = hits.get(key);
    if (!rec || now - rec.ts > windowMs) {
      rec = { count: 1, ts: now };
      hits.set(key, rec);
    } else {
      rec.count += 1;
      if (rec.count > max) {
        c.header('X-RateLimit-Limit', String(max));
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', String(Math.ceil((rec.ts + windowMs - now) / 1000)));
        return c.json({ error: 'Rate limit exceeded', retryAfter: Math.ceil((rec.ts + windowMs - now) / 1000) }, 429);
      }
    }

    const remaining = Math.max(0, max - rec.count);
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil((rec.ts + windowMs - now) / 1000)));

    await next();
  };
}

/**
 * Clear all rate limit records (useful for testing)
 */
export function clearRateLimits() {
  hits.clear();
}
