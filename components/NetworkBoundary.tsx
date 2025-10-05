// Network boundary component that wraps children and shows offline banner & retry
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AppError, createNetworkError } from '@/lib/errors';
import { log } from '@/lib/log';
import { isEnabled } from '@/lib/flags';
import ErrorView from './ErrorView';

interface NetworkBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    isOffline: boolean;
    error?: AppError;
    onRetry: () => void;
  }>;
  showOfflineBanner?: boolean;
  retryOnReconnect?: boolean;
  onNetworkChange?: (isConnected: boolean) => void;
  onError?: (error: AppError) => void;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export default function NetworkBoundary({
  children,
  fallback: FallbackComponent,
  showOfflineBanner = true,
  retryOnReconnect = true,
  onNetworkChange,
  onError,
}: NetworkBoundaryProps) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const [networkError, setNetworkError] = useState<AppError | null>(null);
  const [bannerHeight] = useState(new Animated.Value(0));
  const [retryCallbacks, setRetryCallbacks] = useState<Set<() => void>>(new Set());
  
  const logger = log.scope('NetworkBoundary');

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const newNetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      logger.info('Network state changed', newNetworkState);
      
      const wasOffline = !networkState.isConnected;
      const isNowOnline = newNetworkState.isConnected;
      
      setNetworkState(newNetworkState);
      onNetworkChange?.(isNowOnline);

      // Clear network error when back online
      if (isNowOnline && networkError) {
        setNetworkError(null);
      }

      // Auto-retry when reconnected
      if (wasOffline && isNowOnline && retryOnReconnect) {
        logger.info('Network reconnected, triggering retries');
        retryCallbacks.forEach((callback) => {
          try {
            callback();
          } catch (error) {
            logger.error('Retry callback failed', error);
          }
        });
      }
    });

    return unsubscribe;
  }, [networkState.isConnected, networkError, retryOnReconnect, onNetworkChange, retryCallbacks, logger]);

  // Animate banner visibility
  useEffect(() => {
    if (!isEnabled('error_handling_v1')) return;

    const shouldShowBanner = showOfflineBanner && !networkState.isConnected;
    
    Animated.timing(bannerHeight, {
      toValue: shouldShowBanner ? 60 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [networkState.isConnected, showOfflineBanner, bannerHeight]);

  // Register retry callback
  const registerRetryCallback = useCallback((callback: () => void) => {
    setRetryCallbacks((prev) => new Set(prev).add(callback));
    
    return () => {
      setRetryCallbacks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  // Handle network errors
  const handleNetworkError = useCallback((error: AppError | Error) => {
    const networkError = error instanceof AppError 
      ? error 
      : createNetworkError(error.message);
    
    logger.error('Network error occurred', networkError.toJSON());
    setNetworkError(networkError);
    onError?.(networkError);
  }, [logger, onError]);

  // Retry network operations
  const handleRetry = useCallback(() => {
    logger.info('Manual retry triggered');
    setNetworkError(null);
    
    retryCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.error('Retry callback failed', error);
      }
    });
  }, [retryCallbacks, logger]);

  // Check if we should show fallback
  const shouldShowFallback = !networkState.isConnected || networkError;

  // Render custom fallback if provided
  if (shouldShowFallback && FallbackComponent) {
    return (
      <FallbackComponent
        isOffline={!networkState.isConnected}
        error={networkError || undefined}
        onRetry={handleRetry}
      />
    );
  }

  // Render network error
  if (networkError) {
    return (
      <ErrorView
        error={networkError}
        onRetry={handleRetry}
        onDismiss={() => setNetworkError(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <Animated.View style={[styles.banner, { height: bannerHeight }]}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>📡</Text>
            <Text style={styles.bannerText}>
              {networkState.isInternetReachable === false 
                ? 'No internet connection'
                : 'You are offline'
              }
            </Text>
            <TouchableOpacity onPress={handleRetry} style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <NetworkContext.Provider value={{
          networkState,
          registerRetryCallback,
          handleNetworkError,
        }}>
          {children}
        </NetworkContext.Provider>
      </View>
    </View>
  );
}

// Context for child components to access network utilities
interface NetworkContextValue {
  networkState: NetworkState;
  registerRetryCallback: (callback: () => void) => () => void;
  handleNetworkError: (error: AppError | Error) => void;
}

const NetworkContext = React.createContext<NetworkContextValue | null>(null);

// Hook for child components to use network boundary features
export function useNetworkBoundary() {
  const context = React.useContext(NetworkContext);
  
  if (!context) {
    throw new Error('useNetworkBoundary must be used within a NetworkBoundary');
  }
  
  return context;
}

// Hook for network-aware operations
export function useNetworkAwareOperation<T>(
  operation: () => Promise<T>,
  options: {
    retryOnReconnect?: boolean;
    showError?: boolean;
  } = {}
) {
  const { registerRetryCallback, handleNetworkError, networkState } = useNetworkBoundary();
  const { retryOnReconnect = true, showError = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const execute = useCallback(async (): Promise<T | null> => {
    // Check if offline
    if (!networkState.isConnected) {
      const offlineError = createNetworkError('Operation not available offline');
      setError(offlineError);
      if (showError) {
        handleNetworkError(offlineError);
      }
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const networkError = err instanceof AppError 
        ? err 
        : createNetworkError(err instanceof Error ? err.message : 'Network operation failed');
      
      setError(networkError);
      if (showError) {
        handleNetworkError(networkError);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [operation, networkState.isConnected, showError, handleNetworkError]);
  
  // Register for retry on reconnect
  useEffect(() => {
    if (!retryOnReconnect || !error) return;
    
    return registerRetryCallback(() => {
      execute();
    });
  }, [retryOnReconnect, error, execute, registerRetryCallback]);
  
  return {
    execute,
    isLoading,
    error,
    isOffline: !networkState.isConnected,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  bannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});