import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function NetworkBoundary({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    NetInfo.fetch().then((state) => setOnline(Boolean(state.isConnected)));
    return () => sub();
  }, []);

  return (
    <View style={styles.container}>
      {!online && (
        <View accessibilityLiveRegion="polite" style={styles.banner} testID="offline-banner">
          <Text style={styles.bannerText}>You are offline. Some actions will be queued.</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { backgroundColor: '#fef3c7', padding: 8, alignItems: 'center' },
  bannerText: { color: '#92400e', fontSize: 12 },
});

export default NetworkBoundary;
