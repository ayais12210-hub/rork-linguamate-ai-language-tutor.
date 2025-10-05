import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOfflineStatus } from '@/modules/offline';

export function NetworkBoundary({ children }: { children: React.ReactNode }) {
  const status = useOfflineStatus();
  if (status.isOffline) {
    return (
      <View style={styles.container} testID="network-boundary-offline">
        <Text style={styles.title}>You are offline</Text>
        <Text style={styles.subtitle}>Some actions will be queued and synced later.</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
});
