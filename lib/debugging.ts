// Comprehensive debugging utilities for the language learning app

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug configuration
export const DEBUG_CONFIG = {
  // Logging levels
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4,
  },
  
  // Storage keys
  DEBUG_LOGS_KEY: 'debug_logs',
  PERFORMANCE_LOGS_KEY: 'performance_logs',
  USER_ACTIONS_KEY: 'user_actions',
  
  // Limits
  MAX_LOG_ENTRIES: 2000,
  MAX_PERFORMANCE_ENTRIES: 500,
  MAX_USER_ACTIONS: 1000,
  
  // Performance thresholds
  SLOW_OPERATION_THRESHOLD: 1000, // 1 second
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB
  
  // Debug features
  ENABLE_CONSOLE_LOGS: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_USER_ACTION_TRACKING: true,
  ENABLE_NETWORK_LOGGING: true,
  ENABLE_CRASH_REPORTING: true,
};

// Log levels enum
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

// Log entry interface
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
  userId?: string;
  sessionId?: string;
  platform: string;
  version?: string;
}

// Performance entry interface
export interface PerformanceEntry {
  timestamp: number;
  operation: string;
  duration: number;
  category: 'api' | 'ui' | 'storage' | 'computation' | 'navigation';
  metadata?: any;
  memoryUsage?: number;
}

// User action interface
export interface UserAction {
  timestamp: number;
  action: string;
  screen: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

// Debug logger class
export class DebugLogger {
  private static currentLogLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
  private static sessionId: string = this.generateSessionId();
  private static userId?: string;
  
  // Set log level
  static setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    console.log(`[DebugLogger] Log level set to: ${LogLevel[level]}`);
  }
  
  // Set user ID for logging context
  static setUserId(userId: string): void {
    this.userId = userId;
    console.log(`[DebugLogger] User ID set: ${userId}`);
  }
  
  // Generate session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Core logging method
  private static async log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): Promise<void> {
    if (level > this.currentLogLevel) {
      return;
    }
    
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stack: error?.stack,
      userId: this.userId,
      sessionId: this.sessionId,
      platform: Platform.OS,
      version: '1.0.0',
    };
    
    // Console logging
    if (DEBUG_CONFIG.ENABLE_CONSOLE_LOGS) {
      const levelName = LogLevel[level];
      const timestamp = new Date(logEntry.timestamp).toISOString();
      const prefix = `[${timestamp}] [${levelName}] [${category}]`;
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(prefix, message, data, error);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data);
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.log(prefix, message, data);
          break;
      }
    }
    
    // Store log entry
    try {
      await this.storeLogEntry(logEntry);
    } catch (storageError) {
      console.error('[DebugLogger] Failed to store log entry:', storageError);
    }
  }
  
  // Store log entry in AsyncStorage
  private static async storeLogEntry(logEntry: LogEntry): Promise<void> {
    try {
      const existingLogs = await this.getStoredLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, DEBUG_CONFIG.MAX_LOG_ENTRIES);
      await AsyncStorage.setItem(DEBUG_CONFIG.DEBUG_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('[DebugLogger] Failed to store log entry:', error);
    }
  }
  
  // Get stored logs
  static async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const logs = await AsyncStorage.getItem(DEBUG_CONFIG.DEBUG_LOGS_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('[DebugLogger] Failed to get stored logs:', error);
      return [];
    }
  }
  
  // Public logging methods
  static async error(category: string, message: string, data?: any, error?: Error): Promise<void> {
    await this.log(LogLevel.ERROR, category, message, data, error);
  }
  
  static async warn(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, category, message, data);
  }
  
  static async info(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, category, message, data);
  }
  
  static async debug(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, category, message, data);
  }
  
  static async trace(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.TRACE, category, message, data);
  }
  
  // Clear logs
  static async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEBUG_CONFIG.DEBUG_LOGS_KEY);
      console.log('[DebugLogger] Logs cleared');
    } catch (error) {
      console.error('[DebugLogger] Failed to clear logs:', error);
    }
  }
  
  // Export logs
  static async exportLogs(): Promise<string> {
    try {
      const logs = await this.getStoredLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('[DebugLogger] Failed to export logs:', error);
      return '[]';
    }
  }
  
  // Get logs by level
  static async getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    return logs.filter(log => log.level === level);
  }
  
  // Get logs by category
  static async getLogsByCategory(category: string): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    return logs.filter(log => log.category === category);
  }
  
  // Get logs by time range
  static async getLogsByTimeRange(startTime: number, endTime: number): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    return logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }
}

// Performance monitor class
export class PerformanceMonitor {
  private static performanceEntries: Map<string, number> = new Map();
  
  // Start timing an operation
  static startTiming(operationId: string): void {
    this.performanceEntries.set(operationId, Date.now());
  }
  
  // End timing and log performance
  static async endTiming(
    operationId: string,
    operation: string,
    category: PerformanceEntry['category'],
    metadata?: any
  ): Promise<number> {
    const startTime = this.performanceEntries.get(operationId);
    if (!startTime) {
      await DebugLogger.warn('Performance', `No start time found for operation: ${operationId}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.performanceEntries.delete(operationId);
    
    const performanceEntry: PerformanceEntry = {
      timestamp: Date.now(),
      operation,
      duration,
      category,
      metadata,
      memoryUsage: this.getMemoryUsage(),
    };
    
    // Log slow operations
    if (duration > DEBUG_CONFIG.SLOW_OPERATION_THRESHOLD) {
      await DebugLogger.warn(
        'Performance',
        `Slow operation detected: ${operation} took ${duration}ms`,
        { operationId, category, metadata }
      );
    }
    
    // Store performance entry
    if (DEBUG_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      await this.storePerformanceEntry(performanceEntry);
    }
    
    return duration;
  }
  
  // Get memory usage (approximation)
  private static getMemoryUsage(): number {
    if (Platform.OS === 'web' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }
  
  // Store performance entry
  private static async storePerformanceEntry(entry: PerformanceEntry): Promise<void> {
    try {
      const existingEntries = await this.getStoredPerformanceEntries();
      const updatedEntries = [entry, ...existingEntries].slice(0, DEBUG_CONFIG.MAX_PERFORMANCE_ENTRIES);
      await AsyncStorage.setItem(DEBUG_CONFIG.PERFORMANCE_LOGS_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to store performance entry:', error);
    }
  }
  
  // Get stored performance entries
  static async getStoredPerformanceEntries(): Promise<PerformanceEntry[]> {
    try {
      const entries = await AsyncStorage.getItem(DEBUG_CONFIG.PERFORMANCE_LOGS_KEY);
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to get performance entries:', error);
      return [];
    }
  }
  
  // Measure function execution time
  static async measureFunction<T>(
    fn: () => Promise<T> | T,
    operation: string,
    category: PerformanceEntry['category'],
    metadata?: any
  ): Promise<T> {
    const operationId = `${operation}_${Date.now()}`;
    this.startTiming(operationId);
    
    try {
      const result = await fn();
      await this.endTiming(operationId, operation, category, metadata);
      return result;
    } catch (error) {
      await this.endTiming(operationId, operation, category, { ...metadata, error: true });
      throw error;
    }
  }
  
  // Clear performance data
  static async clearPerformanceData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEBUG_CONFIG.PERFORMANCE_LOGS_KEY);
      console.log('[PerformanceMonitor] Performance data cleared');
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to clear performance data:', error);
    }
  }
}

// User action tracker
export class UserActionTracker {
  private static userId?: string;
  private static sessionId: string = DebugLogger['sessionId'];
  
  // Set user ID
  static setUserId(userId: string): void {
    this.userId = userId;
  }
  
  // Track user action
  static async trackAction(
    action: string,
    screen: string,
    data?: any
  ): Promise<void> {
    if (!DEBUG_CONFIG.ENABLE_USER_ACTION_TRACKING) {
      return;
    }
    
    const userAction: UserAction = {
      timestamp: Date.now(),
      action,
      screen,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
    };
    
    try {
      const existingActions = await this.getStoredActions();
      const updatedActions = [userAction, ...existingActions].slice(0, DEBUG_CONFIG.MAX_USER_ACTIONS);
      await AsyncStorage.setItem(DEBUG_CONFIG.USER_ACTIONS_KEY, JSON.stringify(updatedActions));
      
      await DebugLogger.debug(
        'UserAction',
        `User action: ${action} on ${screen}`,
        { action, screen, data }
      );
    } catch (error) {
      console.error('[UserActionTracker] Failed to track action:', error);
    }
  }
  
  // Get stored actions
  static async getStoredActions(): Promise<UserAction[]> {
    try {
      const actions = await AsyncStorage.getItem(DEBUG_CONFIG.USER_ACTIONS_KEY);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('[UserActionTracker] Failed to get stored actions:', error);
      return [];
    }
  }
  
  // Clear user actions
  static async clearActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEBUG_CONFIG.USER_ACTIONS_KEY);
      console.log('[UserActionTracker] User actions cleared');
    } catch (error) {
      console.error('[UserActionTracker] Failed to clear user actions:', error);
    }
  }
}

// Debug utilities
export const DebugUtils = {
  // Get comprehensive debug info
  async getDebugInfo(): Promise<{
    logs: LogEntry[];
    performance: PerformanceEntry[];
    userActions: UserAction[];
    deviceInfo: any;
  }> {
    const [logs, performance, userActions] = await Promise.all([
      DebugLogger.getStoredLogs(),
      PerformanceMonitor.getStoredPerformanceEntries(),
      UserActionTracker.getStoredActions(),
    ]);
    
    return {
      logs,
      performance,
      userActions,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now(),
      },
    };
  },
  
  // Export all debug data
  async exportDebugData(): Promise<string> {
    const debugInfo = await this.getDebugInfo();
    return JSON.stringify(debugInfo, null, 2);
  },
  
  // Clear all debug data
  async clearAllDebugData(): Promise<void> {
    await Promise.all([
      DebugLogger.clearLogs(),
      PerformanceMonitor.clearPerformanceData(),
      UserActionTracker.clearActions(),
    ]);
    console.log('[DebugUtils] All debug data cleared');
  },

  // Network debugging utilities
  async getNetworkInfo(): Promise<any> {
    try {
      // In a real app, you would use @react-native-community/netinfo
      return {
        isConnected: true,
        type: 'wifi',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[DebugUtils] Failed to get network info:', error);
      return null;
    }
  },

  // Memory debugging utilities
  getMemoryInfo(): any {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
    return null;
  },

  // Storage debugging utilities
  async getStorageInfo(): Promise<{
    totalKeys: number;
    totalSize: number;
    keys: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        } catch (error) {
          console.warn(`[DebugUtils] Failed to get size for key: ${key}`);
        }
      }
      
      return {
        totalKeys: keys.length,
        totalSize,
        keys: [...keys],
      };
    } catch (error) {
      console.error('[DebugUtils] Failed to get storage info:', error);
      return {
        totalKeys: 0,
        totalSize: 0,
        keys: [],
      };
    }
  },

  // Performance debugging utilities
  async getPerformanceInfo(): Promise<any> {
    const performanceEntries = await PerformanceMonitor.getStoredPerformanceEntries();
    const memoryInfo = this.getMemoryInfo();
    
    return {
      totalEntries: performanceEntries.length,
      averageApiTime: this.calculateAverageTime(performanceEntries, 'api'),
      averageUiTime: this.calculateAverageTime(performanceEntries, 'ui'),
      slowOperations: performanceEntries.filter(entry => entry.duration > DEBUG_CONFIG.SLOW_OPERATION_THRESHOLD),
      memoryInfo,
      timestamp: Date.now(),
    };
  },

  calculateAverageTime(entries: any[], category: string): number {
    const categoryEntries = entries.filter(entry => entry.category === category);
    if (categoryEntries.length === 0) return 0;
    
    const totalTime = categoryEntries.reduce((sum, entry) => sum + entry.duration, 0);
    return totalTime / categoryEntries.length;
  },

  // Debug session utilities
  async startDebugSession(): Promise<string> {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await DebugLogger.info('DebugSession', 'Debug session started', { sessionId });
    
    // Store session start info
    await AsyncStorage.setItem('debug_session', JSON.stringify({
      sessionId,
      startTime: Date.now(),
      platform: Platform.OS,
      version: Platform.Version,
    }));
    
    return sessionId;
  },

  async endDebugSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem('debug_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const duration = Date.now() - session.startTime;
        
        await DebugLogger.info('DebugSession', 'Debug session ended', {
          sessionId: session.sessionId,
          duration,
        });
        
        await AsyncStorage.removeItem('debug_session');
      }
    } catch (error) {
      console.error('[DebugUtils] Failed to end debug session:', error);
    }
  },

  // Advanced debugging features
  async captureDebugSnapshot(): Promise<{
    timestamp: number;
    logs: any[];
    performance: any[];
    userActions: any[];
    networkInfo: any;
    memoryInfo: any;
    storageInfo: any;
    deviceInfo: any;
  }> {
    const [logs, performance, userActions, networkInfo, storageInfo] = await Promise.all([
      DebugLogger.getStoredLogs(),
      PerformanceMonitor.getStoredPerformanceEntries(),
      UserActionTracker.getStoredActions(),
      this.getNetworkInfo(),
      this.getStorageInfo(),
    ]);
    
    return {
      timestamp: Date.now(),
      logs: logs.slice(0, 100), // Last 100 logs
      performance: performance.slice(0, 50), // Last 50 performance entries
      userActions: userActions.slice(0, 50), // Last 50 user actions
      networkInfo,
      memoryInfo: this.getMemoryInfo(),
      storageInfo,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now(),
      },
    };
  },

  // Debug report generation
  async generateDebugReport(): Promise<string> {
    try {
      const snapshot = await this.captureDebugSnapshot();
      const performanceInfo = await this.getPerformanceInfo();
      
      const report = {
        reportId: `report_${Date.now()}`,
        timestamp: Date.now(),
        snapshot,
        performanceInfo,
        summary: {
          totalLogs: snapshot.logs.length,
          errorLogs: snapshot.logs.filter(log => log.level === 0).length,
          warningLogs: snapshot.logs.filter(log => log.level === 1).length,
          slowOperations: performanceInfo.slowOperations.length,
          memoryUsage: snapshot.memoryInfo?.usedJSHeapSize || 0,
          storageUsage: snapshot.storageInfo.totalSize,
        },
      };
      
      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('[DebugUtils] Failed to generate debug report:', error);
      return JSON.stringify({ error: 'Failed to generate report' }, null, 2);
    }
  },
};

// Advanced debugging hooks and utilities
export class AdvancedDebugger {
  private static hooks: Map<string, Function[]> = new Map();
  private static interceptors: Map<string, Function> = new Map();
  
  // Hook system for debugging
  static addHook(event: string, callback: Function): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(callback);
  }
  
  static removeHook(event: string, callback: Function): void {
    const hooks = this.hooks.get(event);
    if (hooks) {
      const index = hooks.indexOf(callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
  
  static async triggerHooks(event: string, data: any): Promise<void> {
    const hooks = this.hooks.get(event);
    if (hooks) {
      for (const hook of hooks) {
        try {
          await hook(data);
        } catch (error) {
          console.error(`[AdvancedDebugger] Hook error for event ${event}:`, error);
        }
      }
    }
  }
  
  // Interceptor system for debugging
  static addInterceptor(type: string, interceptor: Function): void {
    this.interceptors.set(type, interceptor);
  }
  
  static removeInterceptor(type: string): void {
    this.interceptors.delete(type);
  }
  
  static async runInterceptor(type: string, data: any): Promise<any> {
    const interceptor = this.interceptors.get(type);
    if (interceptor) {
      try {
        return await interceptor(data);
      } catch (error) {
        console.error(`[AdvancedDebugger] Interceptor error for type ${type}:`, error);
      }
    }
    return data;
  }
  
  // Debug console for runtime debugging
  static createDebugConsole(): {
    log: Function;
    warn: Function;
    error: Function;
    info: Function;
    debug: Function;
  } {
    return {
      log: (message: string, data?: any) => DebugLogger.debug('Console', message, data),
      warn: (message: string, data?: any) => DebugLogger.warn('Console', message, data),
      error: (message: string, data?: any, error?: Error) => DebugLogger.error('Console', message, data, error),
      info: (message: string, data?: any) => DebugLogger.info('Console', message, data),
      debug: (message: string, data?: any) => DebugLogger.debug('Console', message, data),
    };
  }
  
  // Performance profiler
  static createProfiler(name: string): {
    start: () => void;
    end: () => Promise<number>;
    mark: (label: string) => void;
    measure: (startMark: string, endMark: string) => Promise<number>;
  } {
    const marks: Map<string, number> = new Map();
    let startTime: number;
    
    return {
      start: () => {
        startTime = Date.now();
        PerformanceMonitor.startTiming(name);
      },
      
      end: async () => {
        const duration = await PerformanceMonitor.endTiming(name, name, 'computation');
        await this.triggerHooks('profiler:end', { name, duration });
        return duration;
      },
      
      mark: (label: string) => {
        marks.set(label, Date.now());
      },
      
      measure: async (startMark: string, endMark: string) => {
        const startMarkTime = marks.get(startMark);
        const endMarkTime = marks.get(endMark);
        
        if (startMarkTime && endMarkTime) {
          const duration = endMarkTime - startMarkTime;
          await DebugLogger.debug('Profiler', `Measure ${startMark} to ${endMark}`, { duration });
          return duration;
        }
        
        return 0;
      },
    };
  }
}