import type { Context, Next } from 'hono';
import { getConfig } from '../config/env';
import { logger } from '../logging/pino';

// Track failed attempts per email/IP
const failedAttempts = new Map<string, { count: number; firstAttempt: number; locked?: boolean }>();
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION = 60 * 1000; // 1 minute

/**
 * Enhanced rate limiting for authentication endpoints
 * Tracks both per-IP and per-email limits
 */
export function authRateLimit() {
  const config = getConfig.rateLimit();
  const maxAttempts = config.maxLoginAttempts;
  
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'local';
    const correlationId = c.get('correlationId');
    
    // Try to get email from body (for login/signup)
    let email: string | undefined;
    try {
      const body = await c.req.json();
      email = body.email?.toLowerCase();
      // Re-set the body for downstream handlers
      c.set('parsedBody', body);
    } catch {
      // Not JSON or no body
    }
    
    const now = Date.now();
    const key = email || ip; // Use email if available, otherwise IP
    
    // Check if account is locked
    const record = failedAttempts.get(key);
    if (record?.locked) {
      const timeSinceLock = now - record.firstAttempt;
      if (timeSinceLock < LOCKOUT_DURATION) {
        const remainingMinutes = Math.ceil((LOCKOUT_DURATION - timeSinceLock) / 60000);
        
        logger.warn({
          evt: 'auth_account_locked',
          cat: 'security',
          req: { method: c.req.method, path: c.req.path },
          corr: { correlationId },
          data: { key, remainingMinutes },
        }, 'Account locked due to failed attempts');
        
        c.status(429);
        return c.json({
          error: 'Too Many Attempts',
          message: `Account temporarily locked. Please try again in ${remainingMinutes} minutes.`,
          retryAfter: Math.ceil((LOCKOUT_DURATION - timeSinceLock) / 1000),
        });
      } else {
        // Lockout expired, reset
        failedAttempts.delete(key);
      }
    }
    
    // Continue with the request
    await next();
    
    // After the request, check if it was a failed auth attempt
    if (c.res.status === 401 || c.res.status === 400) {
      // Track failed attempt
      const existing = failedAttempts.get(key) || { count: 0, firstAttempt: now };
      
      // Reset if window expired
      if (now - existing.firstAttempt > WINDOW_DURATION) {
        existing.count = 0;
        existing.firstAttempt = now;
      }
      
      existing.count++;
      
      // Check if we should lock the account
      if (existing.count >= maxAttempts * 2) {
        existing.locked = true;
        
        logger.error({
          evt: 'auth_lockout_triggered',
          cat: 'security',
          req: { method: c.req.method, path: c.req.path },
          corr: { correlationId },
          data: { 
            key, 
            attempts: existing.count,
            ip,
            email: email ? '***' : undefined,
          },
        }, 'Account locked after multiple failed attempts');
      }
      
      failedAttempts.set(key, existing);
      
      // Add headers to indicate remaining attempts
      const remainingAttempts = Math.max(0, maxAttempts - existing.count);
      c.header('X-RateLimit-Remaining-Auth', String(remainingAttempts));
      
      if (remainingAttempts === 0 && !existing.locked) {
        // Warn about approaching lockout
        const response = await c.res.json();
        return c.json({
          ...response,
          warning: 'Multiple failed attempts detected. Account will be locked after more failures.',
        }, c.res.status);
      }
    } else if (c.res.status === 200 || c.res.status === 201) {
      // Successful auth, clear failed attempts
      if (key) {
        failedAttempts.delete(key);
      }
    }
  };
}

/**
 * Cleanup old records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now - record.firstAttempt > LOCKOUT_DURATION) {
      failedAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Admin function to unlock an account
 */
export function unlockAccount(emailOrIp: string): boolean {
  const key = emailOrIp.toLowerCase();
  const had = failedAttempts.has(key);
  failedAttempts.delete(key);
  
  if (had) {
    logger.info({
      evt: 'auth_account_unlocked',
      cat: 'security',
      data: { key },
    }, 'Account manually unlocked');
  }
  
  return had;
}

/**
 * Get current lockout status
 */
export function getLockoutStatus(emailOrIp: string): {
  locked: boolean;
  attempts: number;
  remainingMinutes?: number;
} {
  const key = emailOrIp.toLowerCase();
  const record = failedAttempts.get(key);
  
  if (!record) {
    return { locked: false, attempts: 0 };
  }
  
  const now = Date.now();
  const timeSinceLock = now - record.firstAttempt;
  
  if (record.locked && timeSinceLock < LOCKOUT_DURATION) {
    return {
      locked: true,
      attempts: record.count,
      remainingMinutes: Math.ceil((LOCKOUT_DURATION - timeSinceLock) / 60000),
    };
  }
  
  return {
    locked: false,
    attempts: record.count,
  };
}