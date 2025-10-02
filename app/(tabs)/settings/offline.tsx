import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function OfflineSettings() {
  return (
    <View style={styles.container} testID="settings-offline">
      <Stack.Screen options={{ title: 'Offline' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
