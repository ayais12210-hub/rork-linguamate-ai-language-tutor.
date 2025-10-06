import { AppError, getErrorSeverity } from '@/lib/errors/AppError';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  properties: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export interface ErrorEvent extends TelemetryEvent {
  name: 'error';
  properties: {
    errorId: string;
    errorCode: string;
    errorMessage: string;
    severity: string;
    stack?: string;
    context?: Record<string, unknown>;
    screen?: string;
    route?: string;
    isOnline?: boolean;
    appVersion?: string;
    platform?: string;
    deviceModel?: string;
  };
}

export interface ScreenEvent extends TelemetryEvent {
  name: 'screen_view';
  properties: {
    screenName: string;
    routeParams?: Record<string, unknown>;
    previousScreen?: string;
    timeOnScreen?: number;
  };
}

export interface ActionEvent extends TelemetryEvent {
  name: 'action';
  properties: {
    actionName: string;
    actionType: string;
    properties?: Record<string, unknown>;
    screen?: string;
    success?: boolean;
  };
}

type TelemetryEventType = ErrorEvent | ScreenEvent | ActionEvent;

class TelemetryService {
  private events: TelemetryEventType[] = [];
  private userId?: string;
  private sessionId: string;
  private isEnabled: boolean;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = true;
    this.startFlushTimer();
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.startFlushTimer();
    } else {
      this.stopFlushTimer();
    }
  }

  async trackError(
    eventName: string,
    properties: {
      errorId?: string;
      errorCode?: string;
      errorMessage?: string;
      error?: AppError;
      context?: Record<string, unknown>;
      screen?: string;
      route?: string;
      isOnline?: boolean;
    }
  ): Promise<void> {
    if (!this.isEnabled) return;

    const error = properties.error;
    const severity = error ? getErrorSeverity(error) : 'unknown';

    const event: ErrorEvent = {
      name: 'error',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        errorId: properties.errorId || error?.errorId || this.generateErrorId(),
        errorCode: properties.errorCode || error?.code || 'UnknownError',
        errorMessage: properties.errorMessage || error?.message || 'Unknown error',
        severity,
        stack: error?.cause instanceof Error ? error.cause.stack : undefined,
        context: {
          ...properties.context,
          ...error?.context,
        },
        screen: properties.screen,
        route: properties.route,
        isOnline: properties.isOnline,
        appVersion: Constants.expoConfig?.version || 'unknown',
        platform: Platform.OS,
        deviceModel: Device.modelName || 'unknown',
      },
    };

    this.addEvent(event);
  }

  async trackScreen(
    screenName: string,
    properties: {
      routeParams?: Record<string, unknown>;
      previousScreen?: string;
      timeOnScreen?: number;
    } = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    const event: ScreenEvent = {
      name: 'screen_view',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        screenName,
        routeParams: this.sanitizeParams(properties.routeParams),
        previousScreen: properties.previousScreen,
        timeOnScreen: properties.timeOnScreen,
      },
    };

    this.addEvent(event);
  }

  async trackAction(
    actionName: string,
    properties: {
      actionType?: string;
      properties?: Record<string, unknown>;
      screen?: string;
      success?: boolean;
    } = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    const event: ActionEvent = {
      name: 'action',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        actionName,
        actionType: properties.actionType || 'user_action',
        properties: this.sanitizeParams(properties.properties),
        screen: properties.screen,
        success: properties.success,
      },
    };

    this.addEvent(event);
  }

  private addEvent(event: TelemetryEventType): void {
    this.events.push(event);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // In a real app, this would send to your analytics service
      await this.sendToAnalytics(eventsToFlush);
    } catch (error) {
      console.error('Failed to send telemetry events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToFlush);
    }
  }

  private async sendToAnalytics(events: TelemetryEventType[]): Promise<void> {
    // This is where you would integrate with your analytics service
    // Examples: Mixpanel, Amplitude, PostHog, or your own backend
    
    if (__DEV__) {
      console.log('Telemetry events:', events);
    }

    // For now, just log to console in development
    // In production, you would send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(events) });
    }
  }

  private startFlushTimer(): void {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!params) return undefined;

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Remove sensitive data
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncate long strings
        sanitized[key] = value.substring(0, 1000) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'email',
      'phone',
      'ssn',
      'social',
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  // Public method to manually flush events
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Get current event count
  getEventCount(): number {
    return this.events.length;
  }

  // Cleanup
  destroy(): void {
    this.stopFlushTimer();
    this.flush(); // Flush remaining events
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();

// Convenience functions
export const trackError = (eventName: string, properties: Parameters<TelemetryService['trackError']>[1]) =>
  telemetry.trackError(eventName, properties);

export const trackScreen = (screenName: string, properties?: Parameters<TelemetryService['trackScreen']>[1]) =>
  telemetry.trackScreen(screenName, properties);

export const trackAction = (actionName: string, properties?: Parameters<TelemetryService['trackAction']>[1]) =>
  telemetry.trackAction(actionName, properties);