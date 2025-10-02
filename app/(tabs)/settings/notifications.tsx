import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function NotificationSettings() {
  return (
    <View style={styles.container} testID="settings-notifications">
      <Stack.Screen options={{ title: 'Notifications' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
