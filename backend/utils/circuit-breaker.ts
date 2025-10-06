import { logger } from '../logging/pino';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  requestTimeout?: number;
  volumeThreshold?: number;
}

export interface CircuitBreakerState {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  totalRequests: number;
  requestTimestamps: number[];
}

/**
 * Circuit breaker pattern implementation
 * Prevents cascading failures when external services are down
 */
export class CircuitBreaker {
  private readonly name: string;
  private readonly options: Required<CircuitBreakerOptions>;
  private state: CircuitBreakerState;
  
  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod ?? 60000, // 1 minute
      requestTimeout: options.requestTimeout ?? 5000, // 5 seconds
      volumeThreshold: options.volumeThreshold ?? 10, // minimum requests before opening
    };
    
    this.state = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      totalRequests: 0,
      requestTimestamps: [],
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Clean old timestamps
    const now = Date.now();
    this.state.requestTimestamps = this.state.requestTimestamps.filter(
      ts => now - ts < this.options.monitoringPeriod
    );
    
    // Check if circuit should be opened
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = now - (this.state.lastFailureTime || 0);
      
      if (timeSinceLastFailure > this.options.resetTimeout) {
        // Try half-open state
        this.state.state = 'HALF_OPEN';
        logger.info({
          circuit: this.name,
          state: 'HALF_OPEN',
        }, 'Circuit breaker entering half-open state');
      } else {
        // Still open, reject immediately
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        (error as any).code = 'CIRCUIT_OPEN';
        throw error;
      }
    }
    
    // Track request
    this.state.requestTimestamps.push(now);
    this.state.totalRequests++;
    
    try {
      // Execute with timeout
      const result = await this.withTimeout(fn(), this.options.requestTimeout);
      
      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.state.successes++;
    
    if (this.state.state === 'HALF_OPEN') {
      // Success in half-open state, close the circuit
      this.state.state = 'CLOSED';
      this.state.failures = 0;
      
      logger.info({
        circuit: this.name,
        state: 'CLOSED',
        successes: this.state.successes,
      }, 'Circuit breaker closed after successful request');
    }
  }
  
  private onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    const recentRequests = this.state.requestTimestamps.length;
    const failureRate = recentRequests > 0 ? this.state.failures / recentRequests : 0;
    
    // Open circuit if:
    // 1. We've hit the failure threshold
    // 2. We have enough volume to make a decision
    // 3. We're not already open
    if (
      this.state.failures >= this.options.failureThreshold &&
      recentRequests >= this.options.volumeThreshold &&
      this.state.state !== 'OPEN'
    ) {
      this.state.state = 'OPEN';
      
      logger.error({
        circuit: this.name,
        state: 'OPEN',
        failures: this.state.failures,
        failureRate,
        recentRequests,
      }, 'Circuit breaker opened due to failures');
    }
    
    // If we're in half-open state, go back to open
    if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'OPEN';
      
      logger.warn({
        circuit: this.name,
        state: 'OPEN',
      }, 'Circuit breaker reopened after failure in half-open state');
    }
  }
  
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Request timeout after ${ms}ms`);
        (error as any).code = 'TIMEOUT';
        reject(error);
      }, ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  /**
   * Get current circuit breaker status
   */
  getStatus() {
    const now = Date.now();
    const recentRequests = this.state.requestTimestamps.filter(
      ts => now - ts < this.options.monitoringPeriod
    ).length;
    
    return {
      name: this.name,
      state: this.state.state,
      failures: this.state.failures,
      successes: this.state.successes,
      totalRequests: this.state.totalRequests,
      recentRequests,
      lastFailureTime: this.state.lastFailureTime,
      timeSinceLastFailure: this.state.lastFailureTime 
        ? now - this.state.lastFailureTime 
        : null,
    };
  }
  
  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      totalRequests: 0,
      requestTimestamps: [],
    };
    
    logger.info({
      circuit: this.name,
    }, 'Circuit breaker manually reset');
  }
}

// Global registry of circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker
 */
export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  let breaker = circuitBreakers.get(name);
  
  if (!breaker) {
    breaker = new CircuitBreaker(name, options);
    circuitBreakers.set(name, breaker);
  }
  
  return breaker;
}

/**
 * Get all circuit breaker statuses
 */
export function getAllCircuitBreakerStatuses() {
  const statuses: Record<string, any> = {};
  
  circuitBreakers.forEach((breaker, name) => {
    statuses[name] = breaker.getStatus();
  });
  
  return statuses;
}