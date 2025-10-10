/**
 * Performance monitoring utility for Linguamate AI Tutor
 * Provides comprehensive performance tracking for React Native and Web
 */

import { Platform } from 'react-native';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  memoryInfo: MemoryInfo;
  platform: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private isEnabled: boolean = __DEV__;

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Start timing a performance metric
   */
  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    this.timers.set(name, Date.now());
    
    // Store metadata for later use
    if (metadata) {
      this.timers.set(`${name}_metadata`, metadata as any);
    }
  }

  /**
   * End timing and record the metric
   */
  endTimer(name: string): number | null {
    if (!this.isEnabled) return null;
    
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Performance timer '${name}' was not started`);
      return null;
    }

    const duration = Date.now() - startTime;
    const metadata = this.timers.get(`${name}_metadata`) as Record<string, any>;
    
    this.recordMetric(name, duration, metadata);
    
    // Clean up
    this.timers.delete(name);
    if (metadata) {
      this.timers.delete(`${name}_metadata`);
    }
    
    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Log in development
    if (__DEV__) {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
    }
  }

  /**
   * Get memory information (Web only)
   */
  getMemoryInfo(): MemoryInfo {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return {};
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(namePattern: string): PerformanceMetric[] {
    const regex = new RegExp(namePattern);
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Get average value for a metric name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(`^${name}$`);
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    return {
      metrics: this.getMetrics(),
      memoryInfo: this.getMemoryInfo(),
      platform: Platform.OS,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Track React component render time
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric(`component_render_${componentName}`, renderTime, {
      type: 'component_render',
      component: componentName,
    });
  }

  /**
   * Track API request performance
   */
  trackApiRequest(endpoint: string, duration: number, success: boolean): void {
    this.recordMetric(`api_request_${endpoint}`, duration, {
      type: 'api_request',
      endpoint,
      success,
    });
  }

  /**
   * Track navigation performance
   */
  trackNavigation(from: string, to: string, duration: number): void {
    this.recordMetric(`navigation_${from}_to_${to}`, duration, {
      type: 'navigation',
      from,
      to,
    });
  }

  /**
   * Track AI operation performance
   */
  trackAiOperation(operation: string, duration: number, success: boolean): void {
    this.recordMetric(`ai_operation_${operation}`, duration, {
      type: 'ai_operation',
      operation,
      success,
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for tracking component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = Date.now();
  
  return {
    trackRender: () => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    },
  };
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  const TrackedComponent = (props: P) => {
    const startTime = Date.now();
    
    React.useEffect(() => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.trackComponentRender(displayName, renderTime);
    }, []);
    
    return React.createElement(WrappedComponent, props);
  };
  
  TrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return TrackedComponent;
}

/**
 * Decorator for timing async functions
 */
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const timerName = name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(timerName);
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(timerName);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(timerName);
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default performanceMonitor;
