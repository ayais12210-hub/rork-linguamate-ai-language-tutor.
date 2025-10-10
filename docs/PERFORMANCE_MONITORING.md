# Performance Monitoring

This document describes the performance monitoring system added to Linguamate AI Tutor. The system provides comprehensive performance tracking capabilities for React Native and Web platforms, helping developers identify bottlenecks and optimize app performance.

## Overview

The performance monitoring system consists of three main components:

1. **Performance Monitor** (`lib/performance/monitor.ts`) - Core monitoring utilities
2. **React Hooks** (`hooks/usePerformanceMonitor.ts`) - React integration hooks
3. **Performance Dashboard** (`components/dev/PerformanceDashboard.tsx`) - Developer dashboard

## Features

### Core Monitoring Capabilities

- **Timer-based Measurements**: Start and stop timers to measure operation duration
- **Custom Metrics**: Record arbitrary performance metrics with metadata
- **Memory Monitoring**: Track JavaScript heap usage (Web only)
- **Automatic Categorization**: Organize metrics by type (component renders, API calls, etc.)
- **Report Generation**: Export performance data as JSON reports

### Specialized Tracking

- **Component Render Performance**: Track React component mount and render times
- **API Request Performance**: Monitor network request duration and success rates
- **Navigation Performance**: Measure screen transition times
- **AI Operation Performance**: Track AI-related operations (LLM calls, speech processing)
- **User Interaction Tracking**: Monitor user interaction response times

### Developer Tools

- **Real-time Dashboard**: Visual interface for monitoring performance in development
- **Memory Usage Visualization**: Real-time memory consumption charts
- **Metric Filtering**: Filter and search performance metrics by type or name
- **Export Functionality**: Export performance data for analysis

## Quick Start

### Basic Usage

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

// Start timing an operation
performanceMonitor.startTimer('my_operation');

// Perform your operation
await someAsyncOperation();

// End timing and record the metric
const duration = performanceMonitor.endTimer('my_operation');
console.log(`Operation took ${duration}ms`);
```

### React Component Integration

```typescript
import { useComponentLifecycle, useRenderTracking } from '@/hooks/usePerformanceMonitor';

function MyComponent() {
  // Track component lifecycle
  useComponentLifecycle('MyComponent');
  
  // Track render performance
  const renderCount = useRenderTracking('MyComponent', [someDependency]);
  
  return <View>...</View>;
}
```

### API Performance Tracking

```typescript
import { useApiPerformanceTracking } from '@/hooks/usePerformanceMonitor';

function useUserData() {
  const { trackApiCall } = useApiPerformanceTracking();
  
  const fetchUsers = async () => {
    return trackApiCall('/api/users', async () => {
      const response = await fetch('/api/users');
      return response.json();
    });
  };
  
  return { fetchUsers };
}
```

## API Reference

### PerformanceMonitor Class

#### Methods

##### `startTimer(name: string, metadata?: Record<string, any>): void`
Start timing a performance metric.

##### `endTimer(name: string): number | null`
End timing and record the metric. Returns the duration in milliseconds.

##### `recordMetric(name: string, value: number, metadata?: Record<string, any>): void`
Record a custom performance metric.

##### `getMetrics(): PerformanceMetric[]`
Get all recorded metrics.

##### `getMetricsByName(namePattern: string): PerformanceMetric[]`
Get metrics matching a regex pattern.

##### `getAverageMetric(name: string): number | null`
Calculate the average value for a specific metric name.

##### `generateReport(): PerformanceReport`
Generate a comprehensive performance report.

##### `clear(): void`
Clear all recorded metrics and active timers.

### React Hooks

#### `useComponentLifecycle(componentName: string)`
Automatically track component mount and unmount times.

#### `useAsyncOperation(operationName: string)`
Track async operations with loading states and error handling.

#### `useRenderTracking(componentName: string, dependencies?: any[])`
Track component render performance and frequency.

#### `useInteractionTracking()`
Track user interactions (press, swipe, scroll events).

#### `useMemoryMonitoring(intervalMs?: number)`
Monitor memory usage in real-time (Web only).

#### `usePerformanceMetrics(namePattern?: string)`
Get performance metrics with automatic refresh.

#### `usePerformanceReport()`
Generate and manage performance reports.

## Performance Dashboard

The Performance Dashboard is a developer tool that provides real-time monitoring capabilities. It's only available in development mode.

### Enabling the Dashboard

```typescript
import { PerformanceDashboard } from '@/components/dev/PerformanceDashboard';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  
  return (
    <View>
      {/* Your app content */}
      
      {/* Performance Dashboard */}
      <PerformanceDashboard 
        visible={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </View>
  );
}
```

### Dashboard Features

- **Metrics Tab**: View real-time performance metrics grouped by type
- **Memory Tab**: Monitor JavaScript heap usage (Web only)
- **Report Tab**: Generate and export performance reports

## Best Practices

### When to Use Performance Monitoring

1. **During Development**: Always enable monitoring in development to catch performance issues early
2. **Critical User Flows**: Monitor important user journeys (login, lesson completion, etc.)
3. **AI Operations**: Track AI-related operations that may have variable performance
4. **Network Requests**: Monitor API calls to identify slow endpoints
5. **Component Optimization**: Track render performance for complex components

### Performance Optimization Tips

1. **Identify Bottlenecks**: Use the dashboard to identify slow operations
2. **Monitor Memory**: Watch for memory leaks, especially in long-running sessions
3. **Optimize Renders**: Use the render tracking to identify unnecessary re-renders
4. **API Optimization**: Monitor API response times and optimize slow endpoints
5. **User Experience**: Track interaction response times to ensure smooth UX

### Metric Naming Conventions

Use consistent naming patterns for better organization:

- Component renders: `component_render_ComponentName`
- API requests: `api_request_endpoint`
- Navigation: `navigation_from_to`
- AI operations: `ai_operation_type`
- User interactions: `interaction_type`

## Configuration

### Environment Variables

The performance monitor respects the following configuration:

- **Development Mode**: Automatically enabled in `__DEV__` mode
- **Production**: Disabled by default for performance reasons

### Customization

You can customize the monitoring behavior:

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

// Enable/disable monitoring
performanceMonitor.setEnabled(true);

// Clear metrics periodically
setInterval(() => {
  performanceMonitor.clear();
}, 60000); // Clear every minute
```

## Integration with Existing Code

The performance monitoring system is designed to integrate seamlessly with the existing Linguamate codebase:

### tRPC Integration

```typescript
// In your tRPC procedures
export const getUserProfile = publicProcedure
  .query(async ({ ctx }) => {
    performanceMonitor.startTimer('trpc_getUserProfile');
    
    try {
      const result = await ctx.db.user.findUnique(...);
      performanceMonitor.endTimer('trpc_getUserProfile');
      return result;
    } catch (error) {
      performanceMonitor.endTimer('trpc_getUserProfile');
      throw error;
    }
  });
```

### React Query Integration

```typescript
// Monitor React Query operations
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    return performanceMonitor.trackApiCall('/api/users', async () => {
      return trpc.users.list.query();
    });
  },
});
```

## Troubleshooting

### Common Issues

1. **Metrics Not Appearing**: Ensure monitoring is enabled and you're in development mode
2. **Memory Info Unavailable**: Memory monitoring only works on Web platform
3. **Timer Warnings**: Make sure to call `endTimer` for every `startTimer`
4. **Performance Impact**: Monitoring has minimal overhead but can be disabled in production

### Debugging

Enable verbose logging to debug performance monitoring:

```typescript
// Add this to your app initialization
if (__DEV__) {
  console.log('Performance monitoring enabled');
  
  // Log all metrics
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    console.log('Current metrics:', metrics.length);
  }, 10000);
}
```

## Future Enhancements

Potential improvements for the performance monitoring system:

1. **Remote Monitoring**: Send performance data to analytics services
2. **Alerting**: Set up alerts for performance regressions
3. **Automated Optimization**: Suggest optimizations based on metrics
4. **A/B Testing**: Compare performance between different implementations
5. **Historical Analysis**: Store and analyze performance trends over time

## Contributing

When contributing to the performance monitoring system:

1. **Add Tests**: Include unit tests for new monitoring features
2. **Update Documentation**: Keep this documentation current
3. **Follow Patterns**: Use consistent naming and patterns
4. **Consider Performance**: Ensure monitoring doesn't impact app performance
5. **Test Across Platforms**: Verify functionality on both React Native and Web

## License

This performance monitoring system is part of the Linguamate AI Tutor project and follows the same license terms.
