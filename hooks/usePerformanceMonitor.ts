/**
 * React hooks for performance monitoring integration
 * Provides easy-to-use hooks for tracking performance in React components
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { performanceMonitor, PerformanceMetric, PerformanceReport } from '@/lib/performance/monitor';

/**
 * Hook for tracking component mount and unmount times
 */
export function useComponentLifecycle(componentName: string) {
  const mountTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    performanceMonitor.recordMetric(`component_mount_${componentName}`, mountTime, {
      type: 'component_lifecycle',
      phase: 'mount',
      component: componentName,
    });
    
    return () => {
      const unmountTime = Date.now();
      const totalLifetime = unmountTime - mountTimeRef.current;
      performanceMonitor.recordMetric(`component_lifetime_${componentName}`, totalLifetime, {
        type: 'component_lifecycle',
        phase: 'unmount',
        component: componentName,
      });
    };
  }, [componentName]);
}

/**
 * Hook for tracking async operations with automatic timing
 */
export function useAsyncOperation(operationName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    performanceMonitor.startTimer(operationName, metadata);
    
    try {
      const result = await operation();
      const duration = performanceMonitor.endTimer(operationName);
      
      performanceMonitor.recordMetric(`${operationName}_success`, duration || 0, {
        ...metadata,
        success: true,
      });
      
      return result;
    } catch (err) {
      const duration = performanceMonitor.endTimer(operationName);
      const error = err as Error;
      
      performanceMonitor.recordMetric(`${operationName}_error`, duration || 0, {
        ...metadata,
        success: false,
        error: error.message,
      });
      
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [operationName]);
  
  return { execute, isLoading, error };
}

/**
 * Hook for tracking render performance
 */
export function useRenderTracking(componentName: string, dependencies?: any[]) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  useEffect(() => {
    renderCountRef.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
    
    performanceMonitor.recordMetric(`render_${componentName}`, timeSinceLastRender, {
      type: 'render',
      component: componentName,
      renderCount: renderCountRef.current,
    });
    
    lastRenderTimeRef.current = currentTime;
  }, dependencies);
  
  return renderCountRef.current;
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback((
    interactionType: string,
    elementId?: string,
    metadata?: Record<string, any>
  ) => {
    performanceMonitor.recordMetric(`interaction_${interactionType}`, Date.now(), {
      type: 'user_interaction',
      interactionType,
      elementId,
      ...metadata,
    });
  }, []);
  
  const trackPress = useCallback((elementId: string, metadata?: Record<string, any>) => {
    trackInteraction('press', elementId, metadata);
  }, [trackInteraction]);
  
  const trackSwipe = useCallback((direction: string, metadata?: Record<string, any>) => {
    trackInteraction('swipe', undefined, { direction, ...metadata });
  }, [trackInteraction]);
  
  const trackScroll = useCallback((scrollPosition: number, metadata?: Record<string, any>) => {
    trackInteraction('scroll', undefined, { scrollPosition, ...metadata });
  }, [trackInteraction]);
  
  return {
    trackInteraction,
    trackPress,
    trackSwipe,
    trackScroll,
  };
}

/**
 * Hook for monitoring memory usage (Web only)
 */
export function useMemoryMonitoring(intervalMs: number = 5000) {
  const [memoryInfo, setMemoryInfo] = useState(performanceMonitor.getMemoryInfo());
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newMemoryInfo = performanceMonitor.getMemoryInfo();
      setMemoryInfo(newMemoryInfo);
      
      if (newMemoryInfo.usedJSHeapSize) {
        performanceMonitor.recordMetric('memory_usage', newMemoryInfo.usedJSHeapSize, {
          type: 'memory',
          totalHeapSize: newMemoryInfo.totalJSHeapSize,
          heapSizeLimit: newMemoryInfo.jsHeapSizeLimit,
        });
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
  
  return memoryInfo;
}

/**
 * Hook for getting performance metrics
 */
export function usePerformanceMetrics(namePattern?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  
  const refreshMetrics = useCallback(() => {
    const allMetrics = namePattern 
      ? performanceMonitor.getMetricsByName(namePattern)
      : performanceMonitor.getMetrics();
    setMetrics(allMetrics);
  }, [namePattern]);
  
  useEffect(() => {
    refreshMetrics();
    
    // Refresh metrics every 2 seconds
    const interval = setInterval(refreshMetrics, 2000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);
  
  return { metrics, refreshMetrics };
}

/**
 * Hook for generating performance reports
 */
export function usePerformanceReport() {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  
  const generateReport = useCallback(() => {
    const newReport = performanceMonitor.generateReport();
    setReport(newReport);
    return newReport;
  }, []);
  
  const exportReport = useCallback(() => {
    const reportData = performanceMonitor.exportMetrics();
    return reportData;
  }, []);
  
  const clearMetrics = useCallback(() => {
    performanceMonitor.clear();
    setReport(null);
  }, []);
  
  return {
    report,
    generateReport,
    exportReport,
    clearMetrics,
  };
}

/**
 * Hook for tracking API performance
 */
export function useApiPerformanceTracking() {
  const trackApiCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      performanceMonitor.trackApiRequest(endpoint, duration, true);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackApiRequest(endpoint, duration, false);
      throw error;
    }
  }, []);
  
  return { trackApiCall };
}

/**
 * Hook for tracking navigation performance
 */
export function useNavigationTracking() {
  const trackNavigation = useCallback((from: string, to: string) => {
    const startTime = Date.now();
    
    // Return a function to call when navigation is complete
    return () => {
      const duration = Date.now() - startTime;
      performanceMonitor.trackNavigation(from, to, duration);
    };
  }, []);
  
  return { trackNavigation };
}
