import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function AccountSettings() {
  return (
    <View style={styles.container} testID="settings-account">
      <Stack.Screen options={{ title: 'Account' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
