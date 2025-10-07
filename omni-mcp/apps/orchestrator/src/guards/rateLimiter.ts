import { RateLimiter } from 'limiter';
import type { ServerConfig } from '../config/schema.js';

export class RateLimiterGuard {
  private limiters: Map<string, RateLimiter> = new Map();

  createLimiter(serverName: string, config: ServerConfig): RateLimiter {
    const limiter = new RateLimiter({
      tokensPerInterval: config.limits.rps,
      interval: 'second',
      fireImmediately: true,
    });
    
    this.limiters.set(serverName, limiter);
    return limiter;
  }

  async checkLimit(serverName: string): Promise<boolean> {
    const limiter = this.limiters.get(serverName);
    if (!limiter) {
      return true; // No limiter configured
    }

    try {
      await limiter.removeTokens(1);
      return true;
    } catch (error) {
      return false; // Rate limit exceeded
    }
  }

  getLimiter(serverName: string): RateLimiter | undefined {
    return this.limiters.get(serverName);
  }
}