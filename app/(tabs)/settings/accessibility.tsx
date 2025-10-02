import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function AccessibilitySettings() {
  return (
    <View style={styles.container} testID="settings-accessibility">
      <Stack.Screen options={{ title: 'Accessibility' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
