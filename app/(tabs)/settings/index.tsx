import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function SettingsHome() {
  return (
    <View style={styles.container} testID="settings-home">
      <Stack.Screen options={{ title: 'Settings' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
