import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Loading component for Suspense fallback
export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// Generic loading wrapper component
export function withLoading<T extends object>(
  Component: ComponentType<T>,
  loadingMessage?: string
) {
  return function LazyComponent(props: T) {
    return (
      <Suspense fallback={<LoadingView message={loadingMessage} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Lazy screen components
export const PronunciationLab = lazy(() => 
  import('../../features/pronunciation/PronunciationLab').catch(() => ({
    default: () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Pronunciation Lab</Text>
      </View>
    )
  }))
);

export const OfflinePackManager = lazy(() => 
  import('../../features/offline/OfflinePackManager').catch(() => ({
    default: () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Offline Pack Manager</Text>
      </View>
    )
  }))
);

export const AdvancedAnalytics = lazy(() => 
  import('../../features/analytics/AdvancedAnalytics').catch(() => ({
    default: () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Advanced Analytics</Text>
      </View>
    )
  }))
);

export const LanguagePackDownloader = lazy(() => 
  import('../../features/downloads/LanguagePackDownloader').catch(() => ({
    default: () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Language Pack Downloader</Text>
      </View>
    )
  }))
);

export const SpeechRecognitionEngine = lazy(() => 
  import('../../features/speech/SpeechRecognitionEngine').catch(() => ({
    default: () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load Speech Recognition Engine</Text>
      </View>
    )
  }))
);

// Preload utilities
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  static async preload(componentName: string, importFn: () => Promise<any>): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    const promise = importFn().then(module => {
      this.preloadedComponents.add(componentName);
      this.preloadPromises.delete(componentName);
      return module;
    }).catch(error => {
      console.warn(`Failed to preload ${componentName}:`, error);
      this.preloadPromises.delete(componentName);
      throw error;
    });

    this.preloadPromises.set(componentName, promise);
    return promise;
  }

  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  static async preloadNextLessonPack(): Promise<void> {
    try {
      await this.preload('OfflinePackManager', () => import('../../features/offline/OfflinePackManager'));
      await this.preload('LanguagePackDownloader', () => import('../../features/downloads/LanguagePackDownloader'));
    } catch (error) {
      console.warn('Failed to preload lesson pack components:', error);
    }
  }

  static async preloadAnalyticsComponents(): Promise<void> {
    try {
      await this.preload('AdvancedAnalytics', () => import('../../features/analytics/AdvancedAnalytics'));
    } catch (error) {
      console.warn('Failed to preload analytics components:', error);
    }
  }
}

// Hook for lazy loading with error boundaries
export function useLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType<T>
) {
  const [Component, setComponent] = React.useState<ComponentType<T> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    importFn()
      .then(module => {
        if (isMounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
          if (fallback) {
            setComponent(() => fallback);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [importFn, fallback]);

  return { Component, error, loading };
}

// Route-based lazy loading hook
export function useLazyRoute(routeName: string) {
  const getImportFn = React.useCallback(() => {
    switch (routeName) {
      case 'pronunciation-lab':
        return import('../../features/pronunciation/PronunciationLab');
      case 'offline-manager':
        return import('../../features/offline/OfflinePackManager');
      case 'analytics':
        return import('../../features/analytics/AdvancedAnalytics');
      case 'downloads':
        return import('../../features/downloads/LanguagePackDownloader');
      case 'speech-engine':
        return import('../../features/speech/SpeechRecognitionEngine');
      default:
        throw new Error(`Unknown route: ${routeName}`);
    }
  }, [routeName]);

  return useLazyComponent(getImportFn);
}

// Background preloading hook
export function useBackgroundPreloading() {
  React.useEffect(() => {
    // Preload components after a delay to not block initial render
    const timer = setTimeout(() => {
      ComponentPreloader.preloadNextLessonPack();
      ComponentPreloader.preloadAnalyticsComponents();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
}

// Lazy screen wrapper with error boundary
export function LazyScreenWrapper({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <LoadingView />}>
      {children}
    </Suspense>
  );
}

// Export all lazy components with loading wrappers
export const LazyPronunciationLab = withLoading(PronunciationLab, 'Loading Pronunciation Lab...');
export const LazyOfflinePackManager = withLoading(OfflinePackManager, 'Loading Offline Manager...');
export const LazyAdvancedAnalytics = withLoading(AdvancedAnalytics, 'Loading Analytics...');
export const LazyLanguagePackDownloader = withLoading(LanguagePackDownloader, 'Loading Downloads...');
export const LazySpeechRecognitionEngine = withLoading(SpeechRecognitionEngine, 'Loading Speech Engine...');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});

// Import React for hooks
import React from 'react';