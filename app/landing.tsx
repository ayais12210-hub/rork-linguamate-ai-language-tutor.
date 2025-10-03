import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LandingPage from '@/components/marketing/LandingPage';

export default function LandingRoute() {
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container} />
      </SafeAreaView>
    );
  }

  return <LandingPage />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
