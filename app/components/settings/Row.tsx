import React, { memo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface RowProps {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

function RowBase({ label, subtitle, onPress, right, disabled, style, testID }: RowProps) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={disabled}
      style={[styles.row, disabled ? styles.disabled : undefined, style]}
      testID={testID ?? 'settings-row'}
    >
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right}</View>
    </Container>
  );
}

export default memo(RowBase);

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  left: { flex: 1 },
  right: { marginLeft: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  disabled: { opacity: 0.5 },
});