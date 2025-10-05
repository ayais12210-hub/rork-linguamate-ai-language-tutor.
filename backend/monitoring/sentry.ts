import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for backend monitoring
 * Only initializes if SENTRY_DSN environment variable is set
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('[Sentry Backend] DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
      environment: process.env.NODE_ENV || 'development',
      release: process.env.GIT_COMMIT_SHA || process.env.EXPO_PUBLIC_COMMIT_SHA || 'unknown',
      
      // Integrate with profiling if needed
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      
      beforeSend(event, hint) {
        // Redact sensitive information
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[Sentry Backend] Event captured (dev mode):', event);
          return null;
        }
        
        return event;
      },
    });

    console.log('[Sentry Backend] Initialized successfully');
  } catch (error) {
    console.error('[Sentry Backend] Failed to initialize:', error);
  }
}

/**
 * Wrap an async function with Sentry error capturing
 * @param fn - The async function to wrap
 * @returns The wrapped function that captures and re-throws errors
 * 
 * @example
 * ```ts
 * const safeFn = withSentry(async () => {
 *   // your code here
 * });
 * ```
 */
export function withSentry<T extends (...args: any[]) => any>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }) as T;
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}
