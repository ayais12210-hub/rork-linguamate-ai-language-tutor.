// Lightweight logger with environment-based routing and Sentry integration

import { AppError } from './errors';
import { Platform } from 'react-native';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  tag?: string;
  context?: LogContext;
  error?: Error | AppError;
}

class Logger {
  private isDevelopment = __DEV__;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private sentryInstance: any = null;

  // Initialize Sentry if available
  initSentry(sentry: any, dsn: string, environment: string) {
    if (!sentry || !dsn) {
      console.warn('[Logger] Sentry DSN not provided, crash reporting disabled');
      return;
    }

    try {
      sentry.init({
        dsn,
        environment,
        debug: this.isDevelopment,
        tracesSampleRate: this.isDevelopment ? 1.0 : 0.1,
        beforeSend: this.sanitiseEvent.bind(this),
        beforeBreadcrumb: this.sanitiseBreadcrumb.bind(this),
        integrations: [
          // Add default integrations
        ],
      });

      this.sentryInstance = sentry;
      console.log('[Logger] Sentry initialized successfully');
    } catch (error) {
      console.error('[Logger] Failed to initialize Sentry:', error);
    }
  }

  // Sanitise event before sending to Sentry
  private sanitiseEvent(event: any): any {
    // Remove sensitive data
    const sensitiveKeys = [
      'password',
      'token',
      'auth',
      'secret',
      'key',
      'email',
      'phone',
      'ssn',
      'creditCard',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];

    const sanitise = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };

      for (const key in cleaned) {
        const lowerKey = key.toLowerCase();
        
        // Check if key contains sensitive data
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          cleaned[key] = '[REDACTED]';
        } else if (typeof cleaned[key] === 'object') {
          cleaned[key] = sanitise(cleaned[key]);
        }
      }

      return cleaned;
    };

    return sanitise(event);
  }

  // Sanitise breadcrumb data
  private sanitiseBreadcrumb(breadcrumb: any): any {
    if (breadcrumb.data) {
      breadcrumb.data = this.sanitiseEvent(breadcrumb.data);
    }
    return breadcrumb;
  }

  // Core logging method
  private log(level: LogLevel, tag: string, message: string, context?: LogContext, error?: Error | AppError) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      tag,
      context,
      error,
    };

    // Add to history
    this.addToHistory(entry);

    // Format message for console
    const prefix = `[${tag}]`;
    const formattedMessage = `${prefix} ${message}`;

    // Log to console in development
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.log(formattedMessage, context || '');
          break;
        case 'info':
          console.info(formattedMessage, context || '');
          break;
        case 'warn':
          console.warn(formattedMessage, context || '');
          break;
        case 'error':
          console.error(formattedMessage, context || '', error || '');
          break;
      }
    }

    // Send to Sentry in production
    if (!this.isDevelopment && this.sentryInstance) {
      this.sendToSentry(level, tag, message, context, error);
    }
  }

  // Send log to Sentry
  private sendToSentry(level: LogLevel, tag: string, message: string, context?: LogContext, error?: Error | AppError) {
    if (!this.sentryInstance) return;

    try {
      // Add breadcrumb for all logs
      this.sentryInstance.addBreadcrumb({
        message: `[${tag}] ${message}`,
        level: level === 'warn' ? 'warning' : level,
        category: tag,
        data: context,
        timestamp: Date.now() / 1000,
      });

      // Send error events to Sentry
      if (level === 'error' && error) {
        if (error instanceof AppError) {
          this.sentryInstance.captureException(error, {
            level: 'error',
            tags: {
              errorKind: error.kind,
              errorCode: error.code,
              tag,
            },
            contexts: {
              app_error: {
                errorId: error.errorId,
                requestId: error.requestId,
                isRecoverable: error.isRecoverable,
              },
            },
            extra: {
              ...context,
              details: error.details,
            },
          });
        } else {
          this.sentryInstance.captureException(error, {
            level: 'error',
            tags: { tag },
            extra: context,
          });
        }
      } else if (level === 'warn') {
        // Send warnings as messages
        this.sentryInstance.captureMessage(`[${tag}] ${message}`, 'warning');
      }
    } catch (sentryError) {
      console.error('[Logger] Failed to send to Sentry:', sentryError);
    }
  }

  // Add log entry to history
  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    
    // Trim history if needed
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  // Public logging methods
  debug(tag: string, message: string, context?: LogContext) {
    this.log('debug', tag, message, context);
  }

  info(tag: string, message: string, context?: LogContext) {
    this.log('info', tag, message, context);
  }

  warn(tag: string, message: string, context?: LogContext) {
    this.log('warn', tag, message, context);
  }

  error(tag: string, message: string, context?: LogContext, error?: Error | AppError) {
    this.log('error', tag, message, context, error);
  }

  // Get log history
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  // Clear log history
  clearHistory() {
    this.logHistory = [];
  }

  // Set user context for Sentry
  setUser(user: { id?: string; email?: string; username?: string } | null) {
    if (this.sentryInstance) {
      this.sentryInstance.setUser(user);
    }
  }

  // Add custom context
  setContext(key: string, context: any) {
    if (this.sentryInstance) {
      this.sentryInstance.setContext(key, this.sanitiseEvent(context));
    }
  }

  // Add tags
  setTags(tags: Record<string, string | number | boolean>) {
    if (this.sentryInstance) {
      this.sentryInstance.setTags(tags);
    }
  }

  // Capture custom event
  captureEvent(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: any) {
    if (this.sentryInstance) {
      this.sentryInstance.captureMessage(message, level, {
        extra: this.sanitiseEvent(extra),
      });
    }
  }

  // Track performance
  startTransaction(name: string, operation: string) {
    if (this.sentryInstance && this.sentryInstance.startTransaction) {
      return this.sentryInstance.startTransaction({ name, op: operation });
    }
    return null;
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (tag: string, message: string, context?: LogContext) => logger.debug(tag, message, context),
  info: (tag: string, message: string, context?: LogContext) => logger.info(tag, message, context),
  warn: (tag: string, message: string, context?: LogContext) => logger.warn(tag, message, context),
  error: (tag: string, message: string, context?: LogContext, error?: Error | AppError) => logger.error(tag, message, context, error),
};

// Performance tracking helpers
export function trackPerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = Date.now();
  const transaction = logger.startTransaction(operation, 'function');

  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = Date.now() - start;
          logger.info('Performance', `${operation} completed`, { duration });
          transaction?.finish();
          return value;
        })
        .catch((error) => {
          const duration = Date.now() - start;
          logger.error('Performance', `${operation} failed`, { duration }, error);
          transaction?.setStatus('internal_error');
          transaction?.finish();
          throw error;
        });
    } else {
      const duration = Date.now() - start;
      logger.info('Performance', `${operation} completed`, { duration });
      transaction?.finish();
      return result;
    }
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Performance', `${operation} failed`, { duration }, error as Error);
    transaction?.setStatus('internal_error');
    transaction?.finish();
    throw error;
  }
}

// Network request logging
export function logNetworkRequest(
  method: string,
  url: string,
  requestId: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  }
) {
  logger.info('Network', `${method} ${url}`, {
    requestId,
    method,
    url,
    headers: options?.headers,
    hasBody: !!options?.body,
  });
}

export function logNetworkResponse(
  method: string,
  url: string,
  requestId: string,
  status: number,
  duration: number
) {
  const level = status >= 400 ? 'error' : 'info';
  logger[level]('Network', `${method} ${url} -> ${status}`, {
    requestId,
    method,
    url,
    status,
    duration,
  });
}

// Error boundary logging
export function logErrorBoundary(error: Error, errorInfo: any) {
  logger.error('ErrorBoundary', 'React error boundary caught error', {
    componentStack: errorInfo.componentStack,
  }, error);
}