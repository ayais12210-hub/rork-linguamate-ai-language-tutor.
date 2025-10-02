import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  testID?: string;
}

function DestructiveButtonBase({ label, onPress, testID }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} testID={testID ?? 'destructive-btn'}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

export default memo(DestructiveButtonBase);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 12,
    margin: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: { color: '#991B1B', fontWeight: '600' },
});