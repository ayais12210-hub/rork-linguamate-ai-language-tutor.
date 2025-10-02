import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LearnScreen() {
  return (
    <View style={styles.container} testID="learn-screen">
      <Text style={styles.title}>Learn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
});
