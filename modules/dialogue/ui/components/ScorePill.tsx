import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  score: number;
  label?: string;
  testID?: string;
};

export default function ScorePill({ score, label = 'Score', testID }: Props) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 85 ? '#34C759' : percentage >= 70 ? '#FFD700' : '#FF3B30';

  return (
    <View style={[styles.container, { borderColor: color }]} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.score, { color }]}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#FFF',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
    color: '#666',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
});
