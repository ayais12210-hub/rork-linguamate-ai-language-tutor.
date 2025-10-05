// Comprehensive monitoring and analytics system for the language learning app

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugLogger } from './debugging';
import { AppError } from './error-handling';

// Analytics event types
export enum AnalyticsEventType {
  // User events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // Learning events
  LESSON_STARTED = 'lesson_started',
  LESSON_COMPLETED = 'lesson_completed',
  LESSON_FAILED = 'lesson_failed',
  EXERCISE_COMPLETED = 'exercise_completed',
  
  // Chat events
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  CHAT_SESSION_STARTED = 'chat_session_started',
  
  // Navigation events
  SCREEN_VIEW = 'screen_view',
  BUTTON_CLICK = 'button_click',
  
  // Performance events
  APP_LAUNCH = 'app_launch',
  APP_CRASH = 'app_crash',
  SLOW_OPERATION = 'slow_operation',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  SETTING_CHANGED = 'setting_changed',
}

// Analytics event interface
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  platform: string;
  appVersion: string;
  deviceInfo?: any;
}

// User properties interface
export interface UserProperties {
  userId: string;
  email?: string;
  username?: string;
  learningLanguage?: string;
  nativeLanguage?: string;
  level?: string;
  signupDate?: number;
  lastActiveDate?: number;
  totalLessonsCompleted?: number;
  streakDays?: number;
  premiumUser?: boolean;
}

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: number;
  sessionId: string;
  appLaunchTime?: number;
  screenLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  memoryUsage?: number;
  crashCount: number;
  errorCount: number;
}

// Analytics manager class
export class AnalyticsManager {
  private static sessionId: string = this.generateSessionId();
  private static userId?: string;
  private static userProperties: UserProperties | null = null;
  private static eventQueue: AnalyticsEvent[] = [];
  private static isInitialized = false;
  private static maxQueueSize = 1000;
  private static flushInterval = 30000; // 30 seconds
  private static flushTimer: NodeJS.Timeout | null = null;

  // Initialize analytics
  static async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.userId = userId;
    this.sessionId = this.generateSessionId();

    try {
      // Load user properties
      if (userId) {
        await this.loadUserProperties(userId);
      }

      // Start flush timer
      this.startFlushTimer();

      // Track app launch
      await this.trackEvent(AnalyticsEventType.APP_LAUNCH, {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now(),
      });

      this.isInitialized = true;
      if (__DEV__) {

        console.log('[AnalyticsManager] Initialized');

      }

    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to initialize:', error);

      }
    }
  }

  // Generate session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID and properties
  static async setUser(userId: string, properties?: Partial<UserProperties>): Promise<void> {
    this.userId = userId;
    
    if (properties) {
      await this.updateUserProperties(properties);
    } else {
      await this.loadUserProperties(userId);
    }

    await DebugLogger.info('Analytics', `User set: ${userId}`);
  }

  // Update user properties
  static async updateUserProperties(properties: Partial<UserProperties>): Promise<void> {
    try {
      if (!this.userProperties && this.userId) {
        this.userProperties = {
          userId: this.userId,
          signupDate: Date.now(),
          ...properties,
        };
      } else if (this.userProperties) {
        Object.assign(this.userProperties, properties);
      }

      this.userProperties!.lastActiveDate = Date.now();

      // Store user properties
      await AsyncStorage.setItem(
        `user_properties_${this.userId}`,
        JSON.stringify(this.userProperties)
      );

      await DebugLogger.debug('Analytics', 'User properties updated', this.userProperties);

    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to update user properties:', error);

      }
    }
  }

  // Load user properties
  private static async loadUserProperties(userId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`user_properties_${userId}`);
      if (stored) {
        this.userProperties = JSON.parse(stored);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to load user properties:', error);

      }
    }
  }

  // Track analytics event
  static async trackEvent(
    eventType: AnalyticsEventType,
    properties: Record<string, any> = {},
    immediate = false
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        eventType,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        properties,
        platform: Platform.OS,
        appVersion: '1.0.0',
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      };

      // Add to queue
      this.addToQueue(event);

      // Log event
      await DebugLogger.info(
        'Analytics',
        `Event tracked: ${eventType}`,
        { properties, userId: this.userId }
      );

      // Flush immediately if requested
      if (immediate) {
        await this.flush();
      }

    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to track event:', error);

      }
    }
  }

  // Add event to queue
  private static addToQueue(event: AnalyticsEvent): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.eventQueue.shift(); // Remove oldest event
    }
    this.eventQueue.push(event);
  }

  // Start flush timer
  private static startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval) as any;
  }

  // Flush events to storage/remote service
  static async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      // Store events locally
      await this.storeEvents(eventsToFlush);

      // Send to remote analytics service
      await this.sendToRemoteService(eventsToFlush);

      if (__DEV__) {


        console.log(`[AnalyticsManager] Flushed ${eventsToFlush.length} events`);


      }

    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to flush events:', error);

      }
      // Re-add events to queue on failure
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  // Store events locally
  private static async storeEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const existingEvents = await this.getStoredEvents();
      const updatedEvents = [...events, ...existingEvents].slice(0, 5000); // Keep last 5000 events
      await AsyncStorage.setItem('analytics_events', JSON.stringify(updatedEvents));
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to store events:', error);

      }
    }
  }

  // Get stored events
  static async getStoredEvents(): Promise<AnalyticsEvent[]> {
    try {
      const events = await AsyncStorage.getItem('analytics_events');
      return events ? JSON.parse(events) : [];
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to get stored events:', error);

      }
      return [];
    }
  }

  // Send events to remote analytics service
  private static async sendToRemoteService(events: AnalyticsEvent[]): Promise<void> {
    try {
      // In a real app, you would send this to your analytics service
      // For now, just log it
      if (__DEV__) {

        console.log('[AnalyticsManager] Sending to remote service:', events.length, 'events');

      }
      
      // Example: await analyticsService.sendEvents(events);
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to send to remote service:', error);

      }
    }
  }

  // Track screen view
  static async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent(AnalyticsEventType.SCREEN_VIEW, {
      screenName,
      ...properties,
    });
  }

  // Track button click
  static async trackButtonClick(buttonName: string, screenName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent(AnalyticsEventType.BUTTON_CLICK, {
      buttonName,
      screenName,
      ...properties,
    });
  }

  // Track lesson progress
  static async trackLessonStarted(lessonId: string, lessonType: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent(AnalyticsEventType.LESSON_STARTED, {
      lessonId,
      lessonType,
      ...properties,
    });
  }

  static async trackLessonCompleted(
    lessonId: string,
    lessonType: string,
    duration: number,
    score?: number,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(AnalyticsEventType.LESSON_COMPLETED, {
      lessonId,
      lessonType,
      duration,
      score,
      ...properties,
    });

    // Update user properties
    if (this.userProperties) {
      this.userProperties.totalLessonsCompleted = (this.userProperties.totalLessonsCompleted || 0) + 1;
      await this.updateUserProperties({});
    }
  }

  // Track feature usage
  static async trackFeatureUsed(featureName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent(AnalyticsEventType.FEATURE_USED, {
      featureName,
      ...properties,
    });
  }

  // Get analytics summary
  static async getAnalyticsSummary(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: number;
    userProperties: UserProperties | null;
  }> {
    try {
      const allEvents = await this.getStoredEvents();
      const recentEvents = allEvents.filter(
        event => event.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
      );

      const eventsByType = allEvents.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents: allEvents.length,
        eventsByType,
        recentEvents: recentEvents.length,
        userProperties: this.userProperties,
      };
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to get analytics summary:', error);

      }
      return {
        totalEvents: 0,
        eventsByType: {},
        recentEvents: 0,
        userProperties: null,
      };
    }
  }

  // Clear analytics data
  static async clearAnalyticsData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('analytics_events');
      if (this.userId) {
        await AsyncStorage.removeItem(`user_properties_${this.userId}`);
      }
      this.eventQueue = [];
      this.userProperties = null;
      if (__DEV__) {

        console.log('[AnalyticsManager] Analytics data cleared');

      }
    } catch (error) {
      if (__DEV__) {

        console.error('[AnalyticsManager] Failed to clear analytics data:', error);

      }
    }
  }

  // Cleanup
  static cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.isInitialized = false;
  }
}

// Performance monitor class
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    timestamp: Date.now(),
    sessionId: AnalyticsManager['sessionId'],
    screenLoadTimes: {},
    apiResponseTimes: {},
    crashCount: 0,
    errorCount: 0,
  };

  private static screenStartTimes: Map<string, number> = new Map();
  private static apiStartTimes: Map<string, number> = new Map();

  // Track app launch time
  static trackAppLaunch(launchTime: number): void {
    this.metrics.appLaunchTime = launchTime;
    
    AnalyticsManager.trackEvent(AnalyticsEventType.APP_LAUNCH, {
      launchTime,
      platform: Platform.OS,
    });

    DebugLogger.info('Performance', `App launch time: ${launchTime}ms`);
  }

  // Start tracking screen load time
  static startScreenLoad(screenName: string): void {
    this.screenStartTimes.set(screenName, Date.now());
  }

  // End tracking screen load time
  static endScreenLoad(screenName: string): void {
    const startTime = this.screenStartTimes.get(screenName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      this.metrics.screenLoadTimes[screenName] = loadTime;
      this.screenStartTimes.delete(screenName);

      // Track slow screen loads
      if (loadTime > 2000) { // 2 seconds
        AnalyticsManager.trackEvent(AnalyticsEventType.SLOW_OPERATION, {
          operationType: 'screen_load',
          screenName,
          duration: loadTime,
        });
      }

      DebugLogger.debug('Performance', `Screen load time for ${screenName}: ${loadTime}ms`);
    }
  }

  // Start tracking API response time
  static startApiCall(apiEndpoint: string, requestId: string): void {
    this.apiStartTimes.set(requestId, Date.now());
  }

  // End tracking API response time
  static endApiCall(apiEndpoint: string, requestId: string, success: boolean): void {
    const startTime = this.apiStartTimes.get(requestId);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      this.metrics.apiResponseTimes[apiEndpoint] = responseTime;
      this.apiStartTimes.delete(requestId);

      // Track slow API calls
      if (responseTime > 5000) { // 5 seconds
        AnalyticsManager.trackEvent(AnalyticsEventType.SLOW_OPERATION, {
          operationType: 'api_call',
          apiEndpoint,
          duration: responseTime,
          success,
        });
      }

      DebugLogger.debug('Performance', `API response time for ${apiEndpoint}: ${responseTime}ms`);
    }
  }

  // Track memory usage (web only)
  static trackMemoryUsage(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;

      // Track high memory usage
      if (memoryInfo.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
        AnalyticsManager.trackEvent(AnalyticsEventType.SLOW_OPERATION, {
          operationType: 'high_memory_usage',
          memoryUsage: memoryInfo.usedJSHeapSize,
        });
      }
    }
  }

  // Track crash
  static trackCrash(error: AppError): void {
    this.metrics.crashCount++;
    
    AnalyticsManager.trackEvent(AnalyticsEventType.APP_CRASH, {
      errorType: error.type,
      errorMessage: error.message,
      severity: error.severity,
      isRecoverable: error.isRecoverable,
    }, true); // Flush immediately
  }

  // Track error
  static trackError(error: AppError): void {
    this.metrics.errorCount++;
    
    // Don't track every error, just significant ones
    if (error.severity === 'high' || error.severity === 'critical') {
      AnalyticsManager.trackEvent(AnalyticsEventType.SLOW_OPERATION, {
        operationType: 'error',
        errorType: error.type,
        errorMessage: error.message,
        severity: error.severity,
      });
    }
  }

  // Get performance metrics
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  static resetMetrics(): void {
    this.metrics = {
      timestamp: Date.now(),
      sessionId: AnalyticsManager['sessionId'],
      screenLoadTimes: {},
      apiResponseTimes: {},
      crashCount: 0,
      errorCount: 0,
    };
  }
}

// A/B testing manager
export class ABTestManager {
  private static experiments: Map<string, string> = new Map();
  private static isInitialized = false;

  // Initialize A/B testing
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load experiments from storage
      await this.loadExperiments();
      
      // Fetch experiments from remote service
      await this.fetchExperiments();

      this.isInitialized = true;
      if (__DEV__) {

        console.log('[ABTestManager] Initialized');

      }

    } catch (error) {
      if (__DEV__) {

        console.error('[ABTestManager] Failed to initialize:', error);

      }
    }
  }

  // Load experiments from storage
  private static async loadExperiments(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('ab_experiments');
      if (stored) {
        const experiments = JSON.parse(stored);
        this.experiments = new Map(Object.entries(experiments));
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[ABTestManager] Failed to load experiments:', error);

      }
    }
  }

  // Fetch experiments from remote service
  private static async fetchExperiments(): Promise<void> {
    try {
      // In a real app, you would fetch this from your A/B testing service
      // For now, use default experiments
      const defaultExperiments = {
        'lesson_ui_variant': Math.random() > 0.5 ? 'variant_a' : 'variant_b',
        'chat_feature': Math.random() > 0.5 ? 'enabled' : 'disabled',
        'gamification': Math.random() > 0.5 ? 'full' : 'minimal',
      };

      for (const [key, value] of Object.entries(defaultExperiments)) {
        this.experiments.set(key, value);
      }

      // Store experiments
      await AsyncStorage.setItem(
        'ab_experiments',
        JSON.stringify(Object.fromEntries(this.experiments))
      );

    } catch (error) {
      if (__DEV__) {

        console.error('[ABTestManager] Failed to fetch experiments:', error);

      }
    }
  }

  // Get experiment variant
  static getVariant(experimentName: string, defaultVariant = 'control'): string {
    return this.experiments.get(experimentName) || defaultVariant;
  }

  // Track experiment exposure
  static async trackExposure(experimentName: string, variant: string): Promise<void> {
    await AnalyticsManager.trackEvent(AnalyticsEventType.FEATURE_USED, {
      featureName: 'ab_test_exposure',
      experimentName,
      variant,
    });
  }

  // Check if experiment is active
  static isExperimentActive(experimentName: string): boolean {
    return this.experiments.has(experimentName);
  }

  // Get all experiments
  static getAllExperiments(): Record<string, string> {
    return Object.fromEntries(this.experiments);
  }
}

// Monitoring utilities
export const MonitoringUtils = {
  // Initialize all monitoring systems
  async initializeAll(userId?: string): Promise<void> {
    await Promise.all([
      AnalyticsManager.initialize(userId),
      ABTestManager.initialize(),
    ]);
    
    if (__DEV__) {

    
      console.log('[MonitoringUtils] All monitoring systems initialized');

    
    }
  },

  // Get comprehensive monitoring data
  async getMonitoringData(): Promise<{
    analytics: any;
    performance: PerformanceMetrics;
    experiments: Record<string, string>;
  }> {
    const [analytics, performance, experiments] = await Promise.all([
      AnalyticsManager.getAnalyticsSummary(),
      Promise.resolve(PerformanceMonitor.getMetrics()),
      Promise.resolve(ABTestManager.getAllExperiments()),
    ]);

    return {
      analytics,
      performance,
      experiments,
    };
  },

  // Clear all monitoring data
  async clearAllData(): Promise<void> {
    await Promise.all([
      AnalyticsManager.clearAnalyticsData(),
      Promise.resolve(PerformanceMonitor.resetMetrics()),
    ]);
    
    if (__DEV__) {

    
      console.log('[MonitoringUtils] All monitoring data cleared');

    
    }
  },

  // Cleanup all monitoring systems
  cleanup(): void {
    AnalyticsManager.cleanup();
    if (__DEV__) {

      console.log('[MonitoringUtils] All monitoring systems cleaned up');

    }
  },
};

