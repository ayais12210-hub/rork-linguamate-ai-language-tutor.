/**
 * Tests for Performance Monitor utilities
 */

import { performanceMonitor } from '@/lib/performance/monitor';

// Mock Platform for React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setEnabled(true);
  });

  afterEach(() => {
    performanceMonitor.clear();
  });

  describe('Basic functionality', () => {
    it('should record metrics correctly', () => {
      performanceMonitor.recordMetric('test_metric', 100, { test: true });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].metadata).toEqual({ test: true });
    });

    it('should handle timer operations', () => {
      performanceMonitor.startTimer('test_timer');
      
      // Simulate some delay
      const mockDelay = 50;
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // startTimer call
        .mockReturnValueOnce(1000 + mockDelay); // endTimer call
      
      const duration = performanceMonitor.endTimer('test_timer');
      
      expect(duration).toBe(mockDelay);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_timer');
      expect(metrics[0].value).toBe(mockDelay);
    });

    it('should handle timer with metadata', () => {
      const metadata = { component: 'TestComponent', type: 'render' };
      performanceMonitor.startTimer('test_timer', metadata);
      
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);
      
      performanceMonitor.endTimer('test_timer');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual(metadata);
    });

    it('should warn when ending non-existent timer', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = performanceMonitor.endTimer('non_existent_timer');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Performance timer 'non_existent_timer' was not started"
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metric filtering and analysis', () => {
    beforeEach(() => {
      // Add test metrics
      performanceMonitor.recordMetric('component_render_Header', 10);
      performanceMonitor.recordMetric('component_render_Footer', 15);
      performanceMonitor.recordMetric('api_request_users', 200);
      performanceMonitor.recordMetric('component_render_Header', 12);
    });

    it('should filter metrics by name pattern', () => {
      const renderMetrics = performanceMonitor.getMetricsByName('component_render_.*');
      expect(renderMetrics).toHaveLength(3);
      
      const headerMetrics = performanceMonitor.getMetricsByName('component_render_Header');
      expect(headerMetrics).toHaveLength(2);
    });

    it('should calculate average metrics', () => {
      const average = performanceMonitor.getAverageMetric('component_render_Header');
      expect(average).toBe(11); // (10 + 12) / 2
    });

    it('should return null for non-existent metric average', () => {
      const average = performanceMonitor.getAverageMetric('non_existent_metric');
      expect(average).toBeNull();
    });
  });

  describe('Specialized tracking methods', () => {
    it('should track component renders', () => {
      performanceMonitor.trackComponentRender('TestComponent', 25);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('component_render_TestComponent');
      expect(metrics[0].value).toBe(25);
      expect(metrics[0].metadata).toEqual({
        type: 'component_render',
        component: 'TestComponent',
      });
    });

    it('should track API requests', () => {
      performanceMonitor.trackApiRequest('/api/users', 150, true);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].name).toBe('api_request_/api/users');
      expect(metrics[0].metadata).toEqual({
        type: 'api_request',
        endpoint: '/api/users',
        success: true,
      });
    });

    it('should track navigation', () => {
      performanceMonitor.trackNavigation('Home', 'Profile', 300);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].name).toBe('navigation_Home_to_Profile');
      expect(metrics[0].metadata).toEqual({
        type: 'navigation',
        from: 'Home',
        to: 'Profile',
      });
    });

    it('should track AI operations', () => {
      performanceMonitor.trackAiOperation('text_generation', 500, true);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].name).toBe('ai_operation_text_generation');
      expect(metrics[0].metadata).toEqual({
        type: 'ai_operation',
        operation: 'text_generation',
        success: true,
      });
    });
  });

  describe('Memory management', () => {
    it('should limit metrics to 100 entries', () => {
      // Add 150 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`metric_${i}`, i);
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(100);
      
      // Should keep the latest 100
      expect(metrics[0].name).toBe('metric_50');
      expect(metrics[99].name).toBe('metric_149');
    });

    it('should clear all metrics and timers', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      performanceMonitor.startTimer('test_timer');
      
      performanceMonitor.clear();
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
      
      // Timer should be cleared
      const result = performanceMonitor.endTimer('test_timer');
      expect(result).toBeNull();
    });
  });

  describe('Report generation', () => {
    it('should generate performance report', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('memoryInfo');
      expect(report).toHaveProperty('platform');
      expect(report).toHaveProperty('timestamp');
      
      expect(report.metrics).toHaveLength(1);
      expect(report.platform).toBe('web');
    });

    it('should export metrics as JSON', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      
      const exported = performanceMonitor.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('metrics');
      expect(parsed.metrics).toHaveLength(1);
    });
  });

  describe('Enable/disable functionality', () => {
    it('should not record metrics when disabled', () => {
      performanceMonitor.setEnabled(false);
      performanceMonitor.recordMetric('test_metric', 100);
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });

    it('should not start/end timers when disabled', () => {
      performanceMonitor.setEnabled(false);
      
      performanceMonitor.startTimer('test_timer');
      const result = performanceMonitor.endTimer('test_timer');
      
      expect(result).toBeNull();
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('Memory info (Web platform)', () => {
    it('should return memory info on web platform', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      };
      
      Object.defineProperty(global, 'performance', {
        value: { memory: mockMemory },
        writable: true,
      });
      
      const memoryInfo = performanceMonitor.getMemoryInfo();
      
      expect(memoryInfo).toEqual(mockMemory);
    });

    it('should return empty object when memory info not available', () => {
      // Mock Platform.OS as 'ios'
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios' },
      }));
      
      const memoryInfo = performanceMonitor.getMemoryInfo();
      expect(memoryInfo).toEqual({});
    });
  });
});
