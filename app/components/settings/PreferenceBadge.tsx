import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
}

function PreferenceBadgeBase({ label }: Props) {
  return (
    <View style={styles.badge} testID={`pref-badge-${label}`}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export default memo(PreferenceBadgeBase);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    marginRight: 8,
    marginBottom: 8,
  },
  text: { color: '#6366F1', fontSize: 12, fontWeight: '600' },
});