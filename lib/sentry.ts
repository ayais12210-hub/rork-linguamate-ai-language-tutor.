// Sentry integration with PII sanitisation and source maps
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { log } from './log';
import { isEnabled } from './flags';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  enableInExpoDevelopment?: boolean;
  debug?: boolean;
}

class SentryManager {
  private initialized = false;
  private logger = log.scope('Sentry');

  async initialize(config: SentryConfig = {}): Promise<void> {
    if (this.initialized) return;

    const {
      dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment = process.env.NODE_ENV || 'development',
      release = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      enableInExpoDevelopment = false,
      debug = __DEV__,
    } = config;

    // Don't initialize in development unless explicitly enabled
    if (__DEV__ && !enableInExpoDevelopment) {
      this.logger.info('Sentry disabled in development');
      return;
    }

    // Don't initialize without DSN
    if (!dsn) {
      this.logger.warn('Sentry DSN not provided, skipping initialization');
      return;
    }

    // Don't initialize if feature flag is disabled
    if (!isEnabled('sentry_integration')) {
      this.logger.info('Sentry integration disabled by feature flag');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release,
        debug,
        
        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        
        // Session tracking
        enableAutoSessionTracking: true,
        
        // Native crashes
        enableNativeCrashHandling: true,
        
        // Auto-attach stack traces
        attachStacktrace: true,
        
        // Capture unhandled promise rejections
        captureUnhandledRejections: true,
        
        // Before send hook for PII sanitisation
        beforeSend: this.sanitiseEvent,
        
        // Before breadcrumb hook
        beforeBreadcrumb: this.sanitiseBreadcrumb,
        
        // Integration configuration
        integrations: [
          new Sentry.ReactNativeTracing({
            // Tracing origins
            tracingOrigins: ['localhost', /^https:\/\/api\.yourapp\.com/],
            
            // Auto-instrument navigation
            enableNativeFramesTracking: true,
            enableStallTracking: true,
            enableAppStartTracking: true,
          }),
        ],
        
        // Platform-specific configuration
        ...(Platform.OS === 'ios' && {
          enableCaptureFailedRequests: true,
        }),
        
        ...(Platform.OS === 'android' && {
          enableNdk: true,
        }),
      });

      // Set initial context
      Sentry.setContext('app', {
        platform: Platform.OS,
        version: release,
        environment,
      });

      this.initialized = true;
      this.logger.info('Sentry initialized successfully', {
        environment,
        release,
        platform: Platform.OS,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', error);
    }
  }

  // Sanitise events to remove PII
  private sanitiseEvent = (event: Sentry.Event): Sentry.Event | null => {
    try {
      // Remove sensitive data from event
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
        delete event.request.headers['X-API-Key'];
      }

      // Sanitise user data
      if (event.user) {
        // Keep only safe user fields
        event.user = {
          id: event.user.id ? this.hashUserId(event.user.id) : undefined,
          // Remove email, username, ip_address, etc.
        };
      }

      // Sanitise extra data
      if (event.extra) {
        event.extra = this.sanitiseObject(event.extra);
      }

      // Sanitise contexts
      if (event.contexts) {
        event.contexts = this.sanitiseObject(event.contexts);
      }

      // Sanitise tags (keep most tags but remove sensitive ones)
      if (event.tags) {
        delete event.tags.email;
        delete event.tags.phone;
        delete event.tags.user_id; // Use hashed version instead
        if (event.user?.id) {
          event.tags.user_hash = this.hashUserId(event.user.id);
        }
      }

      return event;
    } catch (error) {
      this.logger.error('Error sanitising Sentry event', error);
      return event; // Return original event if sanitisation fails
    }
  };

  // Sanitise breadcrumbs
  private sanitiseBreadcrumb = (breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null => {
    try {
      // Remove sensitive data from breadcrumb
      if (breadcrumb.data) {
        breadcrumb.data = this.sanitiseObject(breadcrumb.data);
      }

      // Filter out sensitive breadcrumb categories
      if (breadcrumb.category === 'auth' || breadcrumb.category === 'pii') {
        return null;
      }

      return breadcrumb;
    } catch (error) {
      this.logger.error('Error sanitising Sentry breadcrumb', error);
      return breadcrumb;
    }
  };

  // Recursively sanitise objects
  private sanitiseObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitiseObject(item));
    }

    const sanitised: any = {};
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'cookie',
      'session',
      'email',
      'phone',
      'ssn',
      'credit_card',
      'card_number',
    ];

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive information
      const isSensitive = sensitiveKeys.some(sensitiveKey => 
        lowerKey.includes(sensitiveKey)
      );

      if (isSensitive) {
        sanitised[key] = '[Redacted]';
      } else if (typeof value === 'string' && this.looksLikeToken(value)) {
        sanitised[key] = '[Token]';
      } else {
        sanitised[key] = this.sanitiseObject(value);
      }
    }

    return sanitised;
  }

  // Check if string looks like a token
  private looksLikeToken(str: string): boolean {
    // JWT pattern
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(str)) {
      return true;
    }
    
    // API key pattern (long alphanumeric strings)
    if (/^[A-Za-z0-9]{32,}$/.test(str)) {
      return true;
    }
    
    return false;
  }

  // Hash user ID for privacy
  private hashUserId(userId: string): string {
    // Simple hash function (in production, use a proper hashing library)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Set user context
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: this.hashUserId(user.id),
      // Don't include email or other PII
    });

    this.logger.debug('User context set', { userId: user.id });
  }

  // Clear user context
  clearUser(): void {
    if (!this.initialized) return;
    
    Sentry.setUser(null);
    this.logger.debug('User context cleared');
  }

  // Add breadcrumb
  addBreadcrumb(message: string, category: string, data?: any): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data: data ? this.sanitiseObject(data) : undefined,
      level: 'info',
    });
  }

  // Set tag
  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    
    Sentry.setTag(key, value);
  }

  // Set context
  setContext(key: string, context: any): void {
    if (!this.initialized) return;
    
    Sentry.setContext(key, this.sanitiseObject(context));
  }

  // Capture exception
  captureException(error: Error, context?: any): void {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('error_context', this.sanitiseObject(context));
      }
      Sentry.captureException(error);
    });

    this.logger.debug('Exception captured', { error: error.message });
  }

  // Capture message
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any): void {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('message_context', this.sanitiseObject(context));
      }
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });

    this.logger.debug('Message captured', { message, level });
  }

  // Start transaction
  startTransaction(name: string, op: string): Sentry.Transaction | null {
    if (!this.initialized) return null;
    
    return Sentry.startTransaction({ name, op });
  }

  // Performance monitoring
  measurePerformance<T>(
    name: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.initialized) {
      return fn();
    }

    const transaction = this.startTransaction(name, operation);
    
    return fn()
      .then((result) => {
        transaction?.setStatus('ok');
        return result;
      })
      .catch((error) => {
        transaction?.setStatus('internal_error');
        this.captureException(error, { operation, name });
        throw error;
      })
      .finally(() => {
        transaction?.finish();
      });
  }

  // Check if Sentry is initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Flush events (useful before app shutdown)
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;
    
    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      this.logger.error('Failed to flush Sentry events', error);
      return false;
    }
  }
}

// Create singleton instance
export const sentry = new SentryManager();

// Convenience functions
export const initializeSentry = (config?: SentryConfig) => sentry.initialize(config);
export const captureException = (error: Error, context?: any) => sentry.captureException(error, context);
export const captureMessage = (message: string, level?: Sentry.SeverityLevel, context?: any) => 
  sentry.captureMessage(message, level, context);
export const addBreadcrumb = (message: string, category: string, data?: any) => 
  sentry.addBreadcrumb(message, category, data);
export const setUser = (user: { id: string; email?: string; username?: string }) => sentry.setUser(user);
export const clearUser = () => sentry.clearUser();

export default sentry;