/**
 * Correlation ID system for request tracing
 * Helps connect frontend and backend logs
 */

import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_KEY = 'x-correlation-id';

export class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private currentId: string | null = null;

  private constructor() {}

  static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  generate(): string {
    this.currentId = uuidv4();
    return this.currentId;
  }

  get(): string | null {
    return this.currentId;
  }

  set(id: string): void {
    this.currentId = id;
  }

  clear(): void {
    this.currentId = null;
  }

  getHeader(): Record<string, string> {
    return this.currentId ? { [CORRELATION_ID_KEY]: this.currentId } : {};
  }

  // For logging purposes
  getLogContext(): Record<string, string> {
    return this.currentId ? { correlationId: this.currentId } : {};
  }
}

export const correlationIdManager = CorrelationIdManager.getInstance();

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
