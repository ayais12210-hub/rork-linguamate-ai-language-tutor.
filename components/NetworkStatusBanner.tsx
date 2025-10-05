import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useIsRestoring, onlineManager } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react-native';

export default function NetworkStatusBanner() {
  const [online, setOnline] = useState<boolean>(onlineManager.isOnline());
  const restoring = useIsRestoring();

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((isOnline?: boolean) => {
      if (__DEV__) {

        console.log('[NetworkStatusBanner] onlineManager change', isOnline);

      }
      setOnline(Boolean(isOnline));
    });

    if (Platform.OS === 'web') {
      const handleOnline = () => {
        if (__DEV__) {

          console.log('[NetworkStatusBanner] browser online');

        }
        onlineManager.setOnline(true);
      };
      const handleOffline = () => {
        if (__DEV__) {

          console.log('[NetworkStatusBanner] browser offline');

        }
        onlineManager.setOnline(false);
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // initialize from navigator.onLine
      if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
        onlineManager.setOnline(Boolean(navigator.onLine));
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribe?.();
      };
    }

    return unsubscribe;
  }, []);

  const show = useMemo(() => {
    if (!online) return true;
    if (restoring) return true;
    return false;
  }, [online, restoring]);

  if (!show) return null;

  const bannerText = !online
    ? 'You are offline. Some features may be unavailable.'
    : 'Restoring data...';

  return (
    <View
      accessibilityRole="alert"
      testID="network-status-banner"
      style={[styles.container, !online ? styles.offline : styles.syncing]}
    >
      {!online ? <WifiOff color="#fff" size={16} /> : null}
      <Text style={styles.text}>{bannerText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 54, android: 34, default: 0 }) as number,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offline: {
    backgroundColor: '#ef4444',
  },
  syncing: {
    backgroundColor: '#6366f1',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
