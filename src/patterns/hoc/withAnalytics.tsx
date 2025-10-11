import React, { ComponentType, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// Analytics service interface
export interface AnalyticsService {
  track: (event: AnalyticsEvent) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
  screen: (name: string, properties?: Record<string, any>) => void;
  group: (groupId: string, traits?: Record<string, any>) => void;
  alias: (newId: string, oldId?: string) => void;
  reset: () => void;
}

// Default analytics service implementation
class DefaultAnalyticsService implements AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string = this.generateSessionId();

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  track(event: AnalyticsEvent): void {
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.events.push(enrichedEvent);
    console.log('Analytics Event:', enrichedEvent);
    
    // In production, send to your analytics service
    // this.sendToAnalyticsService(enrichedEvent);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    console.log('Analytics Identify:', { userId, traits });
  }

  page(name: string, properties?: Record<string, any>): void {
    this.track({
      name: 'page_viewed',
      properties: {
        page_name: name,
        ...properties,
      },
    });
  }

  screen(name: string, properties?: Record<string, any>): void {
    this.track({
      name: 'screen_viewed',
      properties: {
        screen_name: name,
        ...properties,
      },
    });
  }

  group(groupId: string, traits?: Record<string, any>): void {
    this.track({
      name: 'group_identified',
      properties: {
        group_id: groupId,
        ...traits,
      },
    });
  }

  alias(newId: string, oldId?: string): void {
    this.track({
      name: 'user_aliased',
      properties: {
        new_id: newId,
        old_id: oldId,
      },
    });
  }

  reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.events = [];
    console.log('Analytics Reset');
  }
}

// Analytics context
const AnalyticsContext = React.createContext<AnalyticsService | null>(null);

// Analytics provider
export function AnalyticsProvider({ 
  children, 
  service 
}: { 
  children: React.ReactNode; 
  service?: AnalyticsService;
}) {
  const analyticsService = service || new DefaultAnalyticsService();

  return (
    <AnalyticsContext.Provider value={analyticsService}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics
export function useAnalytics(): AnalyticsService {
  const analytics = React.useContext(AnalyticsContext);
  if (!analytics) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return analytics;
}

// HOC configuration
interface WithAnalyticsConfig {
  trackScreenView?: boolean;
  trackAppStateChanges?: boolean;
  trackUserInteractions?: boolean;
  screenName?: string;
  customProperties?: Record<string, any>;
  onMount?: (analytics: AnalyticsService) => void;
  onUnmount?: (analytics: AnalyticsService) => void;
}

// Higher-order component for analytics
export function withAnalytics<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: WithAnalyticsConfig = {}
) {
  const {
    trackScreenView = true,
    trackAppStateChanges = false,
    trackUserInteractions = false,
    screenName,
    customProperties = {},
    onMount,
    onUnmount,
  } = config;

  const WithAnalyticsComponent = (props: P) => {
    const analytics = useAnalytics();
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const componentName = screenName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';

    // Track screen view on mount
    useEffect(() => {
      if (trackScreenView) {
        analytics.screen(componentName, {
          ...customProperties,
          timestamp: Date.now(),
        });
      }

      onMount?.(analytics);

      return () => {
        onUnmount?.(analytics);
      };
    }, [analytics, componentName, customProperties, onMount, onUnmount, trackScreenView]);

    // Track app state changes
    useEffect(() => {
      if (!trackAppStateChanges) return;

      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appStateRef.current !== nextAppState) {
          analytics.track({
            name: 'app_state_changed',
            properties: {
              from: appStateRef.current,
              to: nextAppState,
              screen: componentName,
            },
          });
          appStateRef.current = nextAppState;
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }, [analytics, componentName, trackAppStateChanges]);

    // Track user interactions
    useEffect(() => {
      if (!trackUserInteractions) return;

      const handleInteraction = (event: Event) => {
        analytics.track({
          name: 'user_interaction',
          properties: {
            type: event.type,
            target: (event.target as any)?.tagName || 'unknown',
            screen: componentName,
          },
        });
      };

      // Add event listeners for common interactions
      const events = ['click', 'touchstart', 'keydown', 'focus', 'blur'];
      events.forEach(eventType => {
        document.addEventListener(eventType, handleInteraction, true);
      });

      return () => {
        events.forEach(eventType => {
          document.removeEventListener(eventType, handleInteraction, true);
        });
      };
    }, [analytics, componentName, trackUserInteractions]);

    return <WrappedComponent {...props} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${componentName})`;
  return WithAnalyticsComponent;
}

// Specific analytics HOCs for common use cases
export function withScreenTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  screenName?: string
) {
  return withAnalytics(WrappedComponent, {
    trackScreenView: true,
    screenName,
  });
}

export function withInteractionTracking<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return withAnalytics(WrappedComponent, {
    trackUserInteractions: true,
  });
}

export function withAppStateTracking<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return withAnalytics(WrappedComponent, {
    trackAppStateChanges: true,
  });
}

// Hook for tracking custom events
export function useAnalyticsTracking() {
  const analytics = useAnalytics();

  const trackEvent = React.useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    analytics.track({
      name: eventName,
      properties,
    });
  }, [analytics]);

  const trackPageView = React.useCallback((
    pageName: string,
    properties?: Record<string, any>
  ) => {
    analytics.page(pageName, properties);
  }, [analytics]);

  const trackScreenView = React.useCallback((
    screenName: string,
    properties?: Record<string, any>
  ) => {
    analytics.screen(screenName, properties);
  }, [analytics]);

  const identifyUser = React.useCallback((
    userId: string,
    traits?: Record<string, any>
  ) => {
    analytics.identify(userId, traits);
  }, [analytics]);

  return {
    trackEvent,
    trackPageView,
    trackScreenView,
    identifyUser,
  };
}

export default withAnalytics;