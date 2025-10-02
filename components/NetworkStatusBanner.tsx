import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useIsRestoring, useIsFetching, useIsMutating, useOnline } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react-native';

export default function NetworkStatusBanner() {
  const online = useOnline();
  const restoring = useIsRestoring();
  const fetching = useIsFetching();
  const mutating = useIsMutating();

  const show = useMemo(() => {
    if (!online) return true;
    if (restoring) return true;
    if (fetching > 0 || mutating > 0) return false;
    return false;
  }, [online, restoring, fetching, mutating]);

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
