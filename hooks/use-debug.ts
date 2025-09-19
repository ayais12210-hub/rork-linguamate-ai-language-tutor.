import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { DebugLogger, PerformanceMonitor, UserActionTracker, DebugUtils, LogLevel } from '@/lib/debugging';
import { ErrorHandler, ErrorUtils, AppError } from '@/lib/error-handling';
import { AnalyticsManager } from '@/lib/monitoring';

interface UseDebugOptions {
  enableAutoLogging?: boolean;
  enablePerformanceTracking?: boolean;
  enableUserActionTracking?: boolean;
  logLevel?: LogLevel;
}

interface DebugHookReturn {
  // Logging functions
  log: (category: string, message: string, data?: any) => Promise<void>;
  warn: (category: string, message: string, data?: any) => Promise<void>;
  error: (category: string, message: string, data?: any, error?: Error) => Promise<void>;
  info: (category: string, message: string, data?: any) => Promise<void>;
  debug: (category: string, message: string, data?: any) => Promise<void>;
  
  // Performance tracking
  startTiming: (operationId: string) => void;
  endTiming: (operationId: string, operation: string, category: 'api' | 'ui' | 'storage' | 'computation' | 'navigation', metadata?: any) => Promise<number>;
  measureFunction: <T>(fn: () => Promise<T> | T, operation: string, category: 'api' | 'ui' | 'storage' | 'computation' | 'navigation', metadata?: any) => Promise<T>;
  
  // User action tracking
  trackAction: (action: string, screen: string, data?: any) => Promise<void>;
  
  // Error handling
  handleError: (error: Error | AppError, context?: any, options?: any) => Promise<void>;
  createError: {
    network: (message: string, context?: any) => AppError;
    validation: (message: string, context?: any) => AppError;
    auth: (message: string, context?: any) => AppError;
    api: (message: string, statusCode?: number, context?: any) => AppError;
    timeout: (operation: string, timeout: number, context?: any) => AppError;
    storage: (message: string, context?: any) => AppError;
    learning: (message: string, context?: any) => AppError;
    chat: (message: string, context?: any) => AppError;
  };
  
  // Utility functions
  withErrorHandling: <T>(fn: () => Promise<T>, context?: any) => Promise<T | null>;
  withRetry: <T>(fn: () => Promise<T>, maxRetries?: number, delay?: number, context?: any) => Promise<T>;
  
  // Debug panel
  showDebugPanel: () => void;
  hideDebugPanel: () => void;
  isDebugPanelVisible: boolean;
  
  // Debug info
  getDebugInfo: () => Promise<any>;
  exportDebugData: () => Promise<string>;
  clearDebugData: () => Promise<void>;
}

export function useDebug(options: UseDebugOptions = {}): DebugHookReturn {
  const {
    enableAutoLogging = __DEV__,
    enablePerformanceTracking = true,
    enableUserActionTracking = true,
    logLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  } = options;

  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

  useEffect(() => {
    // Initialize debug systems
    if (enableAutoLogging) {
      DebugLogger.setLogLevel(logLevel);
    }
    
    // Initialize analytics if needed
    AnalyticsManager.initialize().catch(error => {
      console.warn('[useDebug] Failed to initialize analytics:', error);
    });
  }, [enableAutoLogging, logLevel]);

  // Logging functions
  const log = useCallback(async (category: string, message: string, data?: any) => {
    if (enableAutoLogging) {
      await DebugLogger.info(category, message, data);
    }
  }, [enableAutoLogging]);

  const warn = useCallback(async (category: string, message: string, data?: any) => {
    if (enableAutoLogging) {
      await DebugLogger.warn(category, message, data);
    }
  }, [enableAutoLogging]);

  const error = useCallback(async (category: string, message: string, data?: any, errorObj?: Error) => {
    if (enableAutoLogging) {
      await DebugLogger.error(category, message, data, errorObj);
    }
  }, [enableAutoLogging]);

  const info = useCallback(async (category: string, message: string, data?: any) => {
    if (enableAutoLogging) {
      await DebugLogger.info(category, message, data);
    }
  }, [enableAutoLogging]);

  const debug = useCallback(async (category: string, message: string, data?: any) => {
    if (enableAutoLogging) {
      await DebugLogger.debug(category, message, data);
    }
  }, [enableAutoLogging]);

  // Performance tracking
  const startTiming = useCallback((operationId: string) => {
    if (enablePerformanceTracking) {
      PerformanceMonitor.startTiming(operationId);
    }
  }, [enablePerformanceTracking]);

  const endTiming = useCallback(async (
    operationId: string,
    operation: string,
    category: 'api' | 'ui' | 'storage' | 'computation' | 'navigation',
    metadata?: any
  ) => {
    if (enablePerformanceTracking) {
      return await PerformanceMonitor.endTiming(operationId, operation, category, metadata);
    }
    return 0;
  }, [enablePerformanceTracking]);

  const measureFunction = useCallback(async <T>(
    fn: () => Promise<T> | T,
    operation: string,
    category: 'api' | 'ui' | 'storage' | 'computation' | 'navigation',
    metadata?: any
  ): Promise<T> => {
    if (enablePerformanceTracking) {
      return await PerformanceMonitor.measureFunction(fn, operation, category, metadata);
    }
    return await fn();
  }, [enablePerformanceTracking]);

  // User action tracking
  const trackAction = useCallback(async (action: string, screen: string, data?: any) => {
    if (enableUserActionTracking) {
      await UserActionTracker.trackAction(action, screen, data);
    }
  }, [enableUserActionTracking]);

  // Error handling
  const handleError = useCallback(async (
    errorObj: Error | AppError,
    context?: any,
    options?: any
  ) => {
    await ErrorHandler.handleError(errorObj, context, options);
  }, []);

  // Error creation utilities
  const createError = {
    network: (message: string, context?: any) => ErrorUtils.createNetworkError(message, context),
    validation: (message: string, context?: any) => ErrorUtils.createValidationError(message, context),
    auth: (message: string, context?: any) => ErrorUtils.createAuthError(message, context),
    api: (message: string, statusCode?: number, context?: any) => ErrorUtils.createApiError(message, statusCode, context),
    timeout: (operation: string, timeout: number, context?: any) => ErrorUtils.createTimeoutError(operation, timeout, context),
    storage: (message: string, context?: any) => ErrorUtils.createStorageError(message, context),
    learning: (message: string, context?: any) => ErrorUtils.createLearningError(message, context),
    chat: (message: string, context?: any) => ErrorUtils.createChatError(message, context),
  };

  // Utility functions
  const withErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    context?: any
  ): Promise<T | null> => {
    return await ErrorUtils.withErrorHandling(fn, context);
  }, []);

  const withRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context?: any
  ): Promise<T> => {
    return await ErrorUtils.withRetry(fn, maxRetries, delay, context);
  }, []);

  // Debug panel
  const showDebugPanel = useCallback(() => {
    if (__DEV__) {
      setIsDebugPanelVisible(true);
    }
  }, []);

  const hideDebugPanel = useCallback(() => {
    setIsDebugPanelVisible(false);
  }, []);

  // Debug info
  const getDebugInfo = useCallback(async () => {
    return await DebugUtils.getDebugInfo();
  }, []);

  const exportDebugData = useCallback(async () => {
    return await DebugUtils.exportDebugData();
  }, []);

  const clearDebugData = useCallback(async () => {
    await DebugUtils.clearAllDebugData();
    await ErrorHandler.clearErrorData();
  }, []);

  return {
    // Logging functions
    log,
    warn,
    error,
    info,
    debug,
    
    // Performance tracking
    startTiming,
    endTiming,
    measureFunction,
    
    // User action tracking
    trackAction,
    
    // Error handling
    handleError,
    createError,
    
    // Utility functions
    withErrorHandling,
    withRetry,
    
    // Debug panel
    showDebugPanel,
    hideDebugPanel,
    isDebugPanelVisible,
    
    // Debug info
    getDebugInfo,
    exportDebugData,
    clearDebugData,
  };
}

// Hook for screen-specific debugging
export function useScreenDebug(screenName: string, options: UseDebugOptions = {}) {
  const debug = useDebug(options);

  useEffect(() => {
    // Track screen view
    debug.trackAction('screen_view', screenName);
    debug.info('Navigation', `Screen viewed: ${screenName}`);

    return () => {
      debug.info('Navigation', `Screen left: ${screenName}`);
    };
  }, [screenName, debug]);

  // Screen-specific logging with automatic screen context
  const screenLog = useCallback((message: string, data?: any) => {
    return debug.log('Screen', `[${screenName}] ${message}`, data);
  }, [debug, screenName]);

  const screenError = useCallback((message: string, data?: any, error?: Error) => {
    return debug.error('Screen', `[${screenName}] ${message}`, data, error);
  }, [debug, screenName]);

  const screenTrackAction = useCallback((action: string, data?: any) => {
    return debug.trackAction(action, screenName, data);
  }, [debug, screenName]);

  return {
    ...debug,
    screenLog,
    screenError,
    screenTrackAction,
    screenName,
  };
}

// Hook for API debugging
export function useApiDebug(apiName: string, options: UseDebugOptions = {}) {
  const debug = useDebug(options);

  const apiCall = useCallback(async <T>(
    fn: () => Promise<T>,
    endpoint: string,
    method = 'GET'
  ): Promise<T> => {
    const operationId = `${apiName}_${endpoint}_${Date.now()}`;
    const startTime = Date.now();
    
    debug.startTiming(operationId);
    debug.info('API', `${method} ${endpoint} - Starting`, { apiName });

    try {
      const result = await fn();
      const duration = await debug.endTiming(operationId, `${method} ${endpoint}`, 'api', {
        apiName,
        method,
        endpoint,
        success: true,
      });
      
      debug.info('API', `${method} ${endpoint} - Success (${duration}ms)`, { apiName, result });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await debug.endTiming(operationId, `${method} ${endpoint}`, 'api', {
        apiName,
        method,
        endpoint,
        success: false,
        error: true,
      });
      
      debug.error('API', `${method} ${endpoint} - Error (${duration}ms)`, { apiName }, error as Error);
      throw error;
    }
  }, [debug, apiName]);

  const createApiError = useCallback((
    message: string,
    statusCode?: number,
    endpoint?: string
  ) => {
    return debug.createError.api(message, statusCode, {
      apiName,
      endpoint,
    });
  }, [debug, apiName]);

  return {
    ...debug,
    apiCall,
    createApiError,
    apiName,
  };
}

// Development-only debug utilities
export const DevDebugUtils = {
  // Quick debug panel toggle (development only)
  toggleDebugPanel: (() => {
    let debugPanelVisible = false;
    return () => {
      if (__DEV__) {
        debugPanelVisible = !debugPanelVisible;
        console.log(`[DevDebugUtils] Debug panel ${debugPanelVisible ? 'shown' : 'hidden'}`);
        // In a real implementation, this would trigger the debug panel
      }
    };
  })(),

  // Quick error test
  testError: async (type: 'network' | 'validation' | 'auth' | 'api' = 'network') => {
    if (__DEV__) {
      const testErrors = {
        network: () => ErrorUtils.createNetworkError('Test network error'),
        validation: () => ErrorUtils.createValidationError('Test validation error'),
        auth: () => ErrorUtils.createAuthError('Test auth error'),
        api: () => ErrorUtils.createApiError('Test API error', 500),
      };
      
      const error = testErrors[type]();
      await ErrorHandler.handleError(error);
      console.log(`[DevDebugUtils] Test ${type} error created`);
    }
  },

  // Quick performance test
  testPerformance: async () => {
    if (__DEV__) {
      const operationId = 'test_performance';
      PerformanceMonitor.startTiming(operationId);
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
      
      const duration = await PerformanceMonitor.endTiming(operationId, 'Test Performance', 'computation');
      console.log(`[DevDebugUtils] Test performance completed in ${duration}ms`);
    }
  },

  // Memory usage check
  checkMemory: () => {
    if (__DEV__ && Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('[DevDebugUtils] Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      });
    }
  },

  // Export debug data to console
  exportToConsole: async () => {
    if (__DEV__) {
      const debugData = await DebugUtils.exportDebugData();
      console.log('[DevDebugUtils] Debug data exported to console:');
      console.log(debugData);
    }
  },
};