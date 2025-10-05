/**
 * NetworkBoundary Component
 * 
 * Wraps children and shows offline banner when network is unavailable.
 * Provides automatic retry when connection is restored.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { DebugLogger } from '@/lib/debugging';

export type NetworkBoundaryProps = {
  children: React.ReactNode;
  /** Show banner when offline (default: true) */
  showBanner?: boolean;
  /** Callback when network status changes */
  onNetworkChange?: (isConnected: boolean) => void;
  /** Custom offline message */
  offlineMessage?: string;
  /** Allow retry button (default: true) */
  allowRetry?: boolean;
  /** Callback for retry */
  onRetry?: () => void;
};

export default function NetworkBoundary({
  children,
  showBanner = true,
  onNetworkChange,
  offlineMessage = 'No internet connection',
  allowRetry = true,
  onRetry,
}: NetworkBoundaryProps): JSX.Element {
  const [isConnected, setIsConnected] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      
      DebugLogger.info('NetworkBoundary', 'Network status changed', {
        isConnected: connected,
        type: state.type,
        details: state.details,
      });

      setIsConnected(connected);

      // Notify parent
      if (onNetworkChange) {
        onNetworkChange(connected);
      }

      // Show/hide banner
      if (showBanner) {
        if (!connected && !showOfflineBanner) {
          setShowOfflineBanner(true);
        } else if (connected && showOfflineBanner) {
          // Delay hiding to show "Back online" message briefly
          setTimeout(() => {
            setShowOfflineBanner(false);
          }, 2000);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onNetworkChange, showBanner, showOfflineBanner]);

  // Animate banner in/out
  useEffect(() => {
    if (showOfflineBanner) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showOfflineBanner, slideAnim]);

  const handleRetry = () => {
    DebugLogger.info('NetworkBoundary', 'Retry button pressed');
    if (onRetry) {
      onRetry();
    } else {
      // Default: refresh network status
      NetInfo.fetch().then(state => {
        const connected = state.isConnected ?? false;
        setIsConnected(connected);
        if (onNetworkChange) {
          onNetworkChange(connected);
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <Animated.View
          style={[
            styles.banner,
            isConnected ? styles.bannerOnline : styles.bannerOffline,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>
              {isConnected ? '✓' : '⚠️'}
            </Text>
            <Text style={styles.bannerText}>
              {isConnected ? 'Back online' : offlineMessage}
            </Text>
            {!isConnected && allowRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                testID="network-boundary-retry"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerOffline: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 2,
    borderBottomColor: '#FCA5A5',
  },
  bannerOnline: {
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 2,
    borderBottomColor: '#86EFAC',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
