import React, { Profiler, ProfilerOnRenderCallback } from 'react';

// Performance measurement interface
export interface PerformanceMetrics {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

// Performance data storage
class PerformanceStore {
  private metrics: PerformanceMetrics[] = [];
  private renderCounts: Map<string, number> = new Map();

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Track render counts
    const currentCount = this.renderCounts.get(metric.id) || 0;
    this.renderCounts.set(metric.id, currentCount + 1);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getRenderCount(componentId: string): number {
    return this.renderCounts.get(componentId) || 0;
  }

  getAverageRenderTime(componentId: string): number {
    const componentMetrics = this.metrics.filter(m => m.id === componentId);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, m) => sum + m.actualDuration, 0);
    return totalTime / componentMetrics.length;
  }

  getSlowestComponents(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.actualDuration - a.actualDuration)
      .slice(0, limit);
  }

  clear() {
    this.metrics = [];
    this.renderCounts.clear();
  }

  exportReport(): string {
    const report = {
      totalMetrics: this.metrics.length,
      components: Array.from(this.renderCounts.entries()).map(([id, count]) => ({
        id,
        renderCount: count,
        averageRenderTime: this.getAverageRenderTime(id),
      })),
      slowestComponents: this.getSlowestComponents(5),
      summary: {
        totalRenders: Array.from(this.renderCounts.values()).reduce((sum, count) => sum + count, 0),
        averageRenderTime: this.metrics.length > 0 
          ? this.metrics.reduce((sum, m) => sum + m.actualDuration, 0) / this.metrics.length 
          : 0,
      },
    };

    return JSON.stringify(report, null, 2);
  }
}

// Global performance store
const performanceStore = new PerformanceStore();

// Profiler callback
const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) => {
  performanceStore.addMetric({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions,
  });

  // Log slow renders in development
  if (__DEV__ && actualDuration > 16) { // More than one frame
    console.warn(`Slow render detected: ${id} took ${actualDuration.toFixed(2)}ms`);
  }
};

// HOC for wrapping components with profiling
export function withProfiler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  id?: string
) {
  const componentId = id || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
  
  const ProfiledComponent = (props: P) => {
    return (
      <Profiler id={componentId} onRender={onRenderCallback}>
        <WrappedComponent {...props} />
      </Profiler>
    );
  };

  ProfiledComponent.displayName = `withProfiler(${componentId})`;
  return ProfiledComponent;
}

// Hook for accessing performance data
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([]);
  const [renderCounts, setRenderCounts] = React.useState<Map<string, number>>(new Map());

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceStore.getMetrics());
      setRenderCounts(new Map(performanceStore.renderCounts));
    };

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getComponentMetrics = (componentId: string) => {
    return metrics.filter(m => m.id === componentId);
  };

  const getRenderCount = (componentId: string) => {
    return renderCounts.get(componentId) || 0;
  };

  const getAverageRenderTime = (componentId: string) => {
    const componentMetrics = getComponentMetrics(componentId);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, m) => sum + m.actualDuration, 0);
    return totalTime / componentMetrics.length;
  };

  const getSlowestComponents = (limit: number = 10) => {
    return [...metrics]
      .sort((a, b) => b.actualDuration - a.actualDuration)
      .slice(0, limit);
  };

  const clearMetrics = () => {
    performanceStore.clear();
    setMetrics([]);
    setRenderCounts(new Map());
  };

  const exportReport = () => {
    return performanceStore.exportReport();
  };

  return {
    metrics,
    renderCounts,
    getComponentMetrics,
    getRenderCount,
    getAverageRenderTime,
    getSlowestComponents,
    clearMetrics,
    exportReport,
  };
}

// Performance dashboard component
export function PerformanceDashboard() {
  const {
    metrics,
    getSlowestComponents,
    getRenderCount,
    getAverageRenderTime,
    clearMetrics,
    exportReport,
  } = usePerformanceMetrics();

  const slowestComponents = getSlowestComponents(5);
  const totalRenders = Array.from(metrics).reduce((sum, m) => sum + 1, 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>React Performance Dashboard</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Summary</h3>
        <p>Total Renders: {totalRenders}</p>
        <p>Components Tracked: {new Set(metrics.map(m => m.id)).size}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Slowest Components</h3>
        {slowestComponents.map((component, index) => (
          <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
            <strong>{component.id}</strong>
            <br />
            Render Time: {component.actualDuration.toFixed(2)}ms
            <br />
            Render Count: {getRenderCount(component.id)}
            <br />
            Average Time: {getAverageRenderTime(component.id).toFixed(2)}ms
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={clearMetrics} style={{ marginRight: '10px' }}>
          Clear Metrics
        </button>
        <button onClick={() => {
          const report = exportReport();
          console.log('Performance Report:', report);
          navigator.clipboard?.writeText(report);
        }}>
          Export Report
        </button>
      </div>

      <div>
        <h3>All Components</h3>
        {Array.from(new Set(metrics.map(m => m.id))).map(componentId => (
          <div key={componentId} style={{ marginBottom: '5px' }}>
            {componentId}: {getRenderCount(componentId)} renders, 
            avg {getAverageRenderTime(componentId).toFixed(2)}ms
          </div>
        ))}
      </div>
    </div>
  );
}

// Development-only profiler wrapper
export function DevProfiler({ children }: { children: React.ReactNode }) {
  if (!__DEV__) {
    return <>{children}</>;
  }

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}

export default {
  withProfiler,
  usePerformanceMetrics,
  PerformanceDashboard,
  DevProfiler,
  performanceStore,
};