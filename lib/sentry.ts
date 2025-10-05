/**
 * Sentry Integration
 * 
 * Comprehensive crash reporting and error tracking with Sentry.
 * 
 * Setup:
 * 1. Install: npm install @sentry/react-native sentry-expo
 * 2. Set EXPO_PUBLIC_SENTRY_DSN in your .env file
 * 3. Initialize in app/_layout.tsx before rendering
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AppError } from './error-handling';
import { DebugLogger } from './debugging';

export type SentryConfig = {
  dsn?: string;
  environment?: string;
  release?: string;
  dist?: string;
  enableInExpoDevelopment?: boolean;
  debug?: boolean;
  tracesSampleRate?: number;
  beforeSend?: Sentry.EventProcessor;
};

/**
 * Initialize Sentry
 */
export function initializeSentry(config: SentryConfig = {}): void {
  const {
    dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment = __DEV__ ? 'development' : 'production',
    release = Constants.manifest?.version || '1.0.0',
    dist = Constants.manifest?.revisionId || undefined,
    enableInExpoDevelopment = false,
    debug = __DEV__,
    tracesSampleRate = 0.2,
    beforeSend,
  } = config;

  // Skip Sentry in development unless explicitly enabled
  if (__DEV__ && !enableInExpoDevelopment) {
    console.log('[Sentry] Skipping Sentry init in development');
    return;
  }

  // Validate DSN
  if (!dsn) {
    console.warn('[Sentry] No DSN provided, Sentry will not be initialized');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      dist,
      debug,
      
      // Tracing
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      tracesSampleRate,
      
      // Native crash reporting
      enableNative: true,
      enableNativeCrashHandling: true,
      enableAutoPerformanceTracing: true,
      
      // Integrations
      integrations: [
        new Sentry.ReactNativeTracing({
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          tracingOrigins: ['localhost', /^\//],
        }),
      ],
      
      // Before send hook for PII sanitization
      beforeSend: (event, hint) => {
        // Custom beforeSend logic
        if (beforeSend) {
          event = beforeSend(event, hint);
          if (!event) return null;
        }
        
        // Sanitize PII
        event = sanitizeEvent(event);
        
        return event;
      },
      
      // Before breadcrumb hook
      beforeBreadcrumb: (breadcrumb) => {
        // Sanitize breadcrumbs
        return sanitizeBreadcrumb(breadcrumb);
      },
    });

    // Set default user context
    Sentry.setContext('device', {
      platform: Platform.OS,
      version: Platform.Version,
      model: Constants.deviceName || 'unknown',
    });

    console.log('[Sentry] Initialized successfully', {
      environment,
      release,
      dist,
    });

    DebugLogger.info('Sentry', 'Sentry initialized', {
      environment,
      release,
      dist,
    });
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Sanitize Sentry event to remove PII
 */
function sanitizeEvent(event: Sentry.Event): Sentry.Event {
  // Remove user email and username
  if (event.user) {
    if (event.user.email) {
      event.user.email = '[REDACTED]';
    }
    if (event.user.username) {
      event.user.username = '[REDACTED]';
    }
    // Keep user ID for tracking
  }

  // Sanitize request data
  if (event.request) {
    // Remove auth headers
    if (event.request.headers) {
      const headers = event.request.headers;
      if (headers.Authorization) {
        headers.Authorization = '[REDACTED]';
      }
      if (headers['X-Auth-Token']) {
        headers['X-Auth-Token'] = '[REDACTED]';
      }
    }
    
    // Remove query params that might contain sensitive data
    if (event.request.query_string) {
      event.request.query_string = sanitizeQueryString(event.request.query_string);
    }
  }

  // Sanitize extra data
  if (event.extra) {
    event.extra = sanitizeObject(event.extra);
  }

  return event;
}

/**
 * Sanitize breadcrumbs
 */
function sanitizeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Remove sensitive data from network breadcrumbs
  if (breadcrumb.category === 'http' || breadcrumb.category === 'fetch') {
    if (breadcrumb.data) {
      // Remove auth headers
      if (breadcrumb.data.headers) {
        breadcrumb.data.headers = sanitizeObject(breadcrumb.data.headers);
      }
      // Remove request/response bodies
      delete breadcrumb.data.request_body;
      delete breadcrumb.data.response_body;
    }
  }

  // Remove navigation params that might contain sensitive data
  if (breadcrumb.category === 'navigation') {
    if (breadcrumb.data?.params) {
      breadcrumb.data.params = sanitizeObject(breadcrumb.data.params);
    }
  }

  return breadcrumb;
}

/**
 * Sanitize object by removing sensitive keys
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'api_key',
    'apikey',
    'auth',
    'credential',
    'private_key',
    'access_token',
    'refresh_token',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key is sensitive
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = Array.isArray(value)
        ? value.map(item => typeof item === 'object' ? sanitizeObject(item) : item)
        : sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize query string
 */
function sanitizeQueryString(query: string): string {
  const sensitiveParams = ['token', 'api_key', 'apikey', 'secret', 'password'];
  
  return query
    .split('&')
    .map(param => {
      const [key] = param.split('=');
      const lowerKey = key.toLowerCase();
      
      if (sensitiveParams.some(sensitive => lowerKey.includes(sensitive))) {
        return `${key}=[REDACTED]`;
      }
      return param;
    })
    .join('&');
}

/**
 * Set user context
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser({
    id: user.id,
    // Don't send email/username to Sentry
    // Add other non-PII properties as needed
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Set custom context
 */
export function setSentryContext(
  key: string,
  context: Record<string, any>
): void {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception
 */
export function captureSentryException(
  error: Error | AppError,
  context?: Record<string, any>
): string {
  // Add context if provided
  if (context) {
    Sentry.setContext('error_context', context);
  }

  // Set extra data for AppError
  if (error instanceof AppError) {
    Sentry.setContext('app_error', {
      type: error.type,
      severity: error.severity,
      errorId: error.errorId,
      isRecoverable: error.isRecoverable,
      context: error.context,
    });
  }

  return Sentry.captureException(error);
}

/**
 * Capture message
 */
export function captureSentryMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  if (context) {
    Sentry.setContext('message_context', context);
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Start transaction for performance monitoring
 */
export function startSentryTransaction(
  name: string,
  op: string
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap component with Sentry profiler
 */
export function withSentryProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
): React.ComponentType<P> {
  return Sentry.withProfiler(Component, { name });
}

/**
 * Get Sentry client
 */
export function getSentryClient(): Sentry.ReactNativeClient | undefined {
  return Sentry.getCurrentHub().getClient();
}

/**
 * Flush Sentry events
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return await Sentry.flush(timeout);
}

/**
 * Close Sentry
 */
export async function closeSentry(timeout = 2000): Promise<boolean> {
  return await Sentry.close(timeout);
}

/**
 * Export Sentry for direct access if needed
 */
export { Sentry };
