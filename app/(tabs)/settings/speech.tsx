import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SettingsScreen from '../../settings';

export default function SpeechSettings() {
  return (
    <View style={styles.container} testID="settings-speech">
      <Stack.Screen options={{ title: 'Speech' }} />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
