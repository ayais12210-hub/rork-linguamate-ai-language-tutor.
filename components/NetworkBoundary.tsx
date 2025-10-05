// Network boundary component for handling offline states and network errors

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppError } from '@/lib/errors';
import ErrorView from './ErrorView';

interface NetworkBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ isOnline: boolean; retry: () => void }>;
  onConnectionChange?: (isOnline: boolean) => void;
  showOfflineBanner?: boolean;
}

export default function NetworkBoundary({
  children,
  fallback: FallbackComponent,
  onConnectionChange,
  showOfflineBanner = true,
}: NetworkBoundaryProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
      onConnectionChange?.(online);

      // Animate banner
      if (!online && showOfflineBanner) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
      onConnectionChange?.(online);
    });

    return unsubscribe;
  }, [onConnectionChange, showOfflineBanner, slideAnim]);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    
    // Check connection
    NetInfo.fetch().then((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
    });
  };

  // Show custom fallback if provided
  if (!isOnline && FallbackComponent) {
    return <FallbackComponent isOnline={isOnline} retry={handleRetry} />;
  }

  // Show error view if there's a network error
  if (hasError && error && error.kind === 'Network') {
    return (
      <View style={styles.container}>
        <ErrorView
          error={error}
          onRetry={handleRetry}
          fullScreen
          customMessage={
            !isOnline
              ? "You're offline. Please check your internet connection."
              : error.getUserMessage()
          }
        />
      </View>
    );
  }

  return (
    <>
      {children}
      
      {showOfflineBanner && (
        <Animated.View
          style={[
            styles.offlineBanner,
            { transform: [{ translateY: slideAnim }] },
          ]}
          pointerEvents={isOnline ? 'none' : 'auto'}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.offlineIcon}>🔌</Text>
            <Text style={styles.offlineText}>No internet connection</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </>
  );
}

// Utility component for pages that require network
export function RequireNetwork({
  children,
  message = 'This feature requires an internet connection',
}: {
  children: React.ReactNode;
  message?: string;
}) {
  return (
    <NetworkBoundary
      fallback={({ retry }) => (
        <View style={styles.offlineContainer}>
          <View style={styles.offlineCard}>
            <Text style={styles.offlineEmoji}>📵</Text>
            <Text style={styles.offlineTitle}>You're Offline</Text>
            <Text style={styles.offlineMessage}>{message}</Text>
            <TouchableOpacity onPress={retry} style={styles.offlineRetryButton}>
              <Text style={styles.offlineRetryText}>Check Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      {children}
    </NetworkBoundary>
  );
}

// Hook to check network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isInternetReachable };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    paddingTop: 50, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  offlineText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Full screen offline styles
  offlineContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  offlineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 320,
    width: '100%',
  },
  offlineEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  offlineMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  offlineRetryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  offlineRetryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});