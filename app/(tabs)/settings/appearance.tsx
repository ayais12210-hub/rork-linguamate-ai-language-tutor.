import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function AppearanceSettings() {
  return (
    <View style={styles.container} testID="settings-appearance">
      <Stack.Screen options={{ title: 'Appearance' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
