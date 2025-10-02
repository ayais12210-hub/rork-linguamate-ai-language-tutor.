import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  message: string;
  tone?: 'gentle' | 'neutral' | 'strict';
  testID?: string;
};

export default function CoachTip({ message, tone = 'neutral', testID = 'coach-tip' }: Props) {
  const icon = tone === 'gentle' ? '💡' : tone === 'strict' ? '⚠️' : 'ℹ️';

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});
