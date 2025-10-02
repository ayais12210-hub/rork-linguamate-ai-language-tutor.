import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function PrivacySettings() {
  return (
    <View style={styles.container} testID="settings-privacy">
      <Stack.Screen options={{ title: 'Privacy' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
