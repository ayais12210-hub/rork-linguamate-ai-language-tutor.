/**
 * Correlation ID system for request tracing
 * Helps connect frontend and backend logs
 */

import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

const CORRELATION_ID_KEY = 'x-correlation-id';

export class CorrelationIdManager {
  private storage = new AsyncLocalStorage<{ id: string | null }>();

  runWithId<T>(fn: () => T, id?: string): T {
    const correlationId = id || uuidv4();
    return this.storage.run({ id: correlationId }, fn);
  }

  generate(): string {
    const id = uuidv4();
    this.set(id);
    return id;
  }

  get(): string | null {
    const store = this.storage.getStore();
    return store ? store.id : null;
  }

  set(id: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.id = id;
    } else {
      // If not in a context, start one
      this.storage.enterWith({ id });
    }
  }

  clear(): void {
    const store = this.storage.getStore();
    if (store) {
      store.id = null;
    }
  }

  getHeader(): Record<string, string> {
    const id = this.get();
    return id ? { [CORRELATION_ID_KEY]: id } : {};
  }

  // For logging purposes
  getLogContext(): Record<string, string> {
    const id = this.get();
    return id ? { correlationId: id } : {};
  }
}

export const correlationIdManager = new CorrelationIdManager();

// Helper function to wrap tRPC client with correlation IDs
export function withCorrelationId<T extends Record<string, any>>(
  client: T,
  baseHeaders: Record<string, string> = {}
): T {
  const proxy = new Proxy(client, {
    get(target, prop) {
      const originalMethod = target[prop as keyof T];
      
      if (typeof originalMethod === 'function') {
        return function(...args: any[]) {
          const correlationId = correlationIdManager.get();
          const headers = {
            ...baseHeaders,
            ...correlationIdManager.getHeader(),
          };
          
          // Add correlation ID to the context if the method accepts it
          if (args.length > 0 && typeof args[0] === 'object' && args[0].context) {
            args[0].context = {
              ...args[0].context,
              headers: {
                ...args[0].context.headers,
                ...headers,
              },
            };
          }
          
          return originalMethod.apply(this, args);
        };
      }
      
      return originalMethod;
    },
  });
  
  return proxy;
}

// Helper for logging with correlation ID
export function logWithCorrelationId(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const context = correlationIdManager.getLogContext();
  const logData = { ...context, ...data };
  
  switch (level) {
    case 'info':
      console.info(`[${context.correlationId || 'no-id'}] ${message}`, logData);
      break;
    case 'warn':
      console.warn(`[${context.correlationId || 'no-id'}] ${message}`, logData);
      break;
    case 'error':
      console.error(`[${context.correlationId || 'no-id'}] ${message}`, logData);
      break;
  }
}
