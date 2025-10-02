import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function LanguageSettings() {
  return (
    <View style={styles.container} testID="settings-language">
      <Stack.Screen options={{ title: 'Language & Script' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
