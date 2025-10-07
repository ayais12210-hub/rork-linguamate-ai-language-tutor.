import CircuitBreaker from 'opossum';
import type { ServerConfig } from '../config/schema.js';

export class CircuitBreakerGuard {
  private breakers: Map<string, CircuitBreaker> = new Map();

  createBreaker(serverName: string, config: ServerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker(this.createServerFunction(serverName), {
      timeout: config.limits.timeoutMs,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: serverName,
    });

    breaker.on('open', () => {
      console.warn(`Circuit breaker opened for server: ${serverName}`);
    });

    breaker.on('halfOpen', () => {
      console.info(`Circuit breaker half-open for server: ${serverName}`);
    });

    breaker.on('close', () => {
      console.info(`Circuit breaker closed for server: ${serverName}`);
    });

    this.breakers.set(serverName, breaker);
    return breaker;
  }

  private createServerFunction(serverName: string) {
    return async () => {
      // This is a placeholder - the actual server communication
      // would be implemented in the bootstrap process
      throw new Error(`Server function not implemented for ${serverName}`);
    };
  }

  async execute(serverName: string, fn: () => Promise<any>): Promise<any> {
    const breaker = this.breakers.get(serverName);
    if (!breaker) {
      return fn();
    }

    return breaker.fire(fn);
  }

  getBreaker(serverName: string): CircuitBreaker | undefined {
    return this.breakers.get(serverName);
  }

  getBreakerState(serverName: string): string | undefined {
    const breaker = this.breakers.get(serverName);
    return breaker ? 'unknown' : undefined;
  }
}