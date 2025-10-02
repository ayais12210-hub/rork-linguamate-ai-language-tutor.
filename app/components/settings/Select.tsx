import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Row from './Row';

interface SelectRowProps<T extends string> {
  label: string;
  subtitle?: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  testID?: string;
}

function SelectRowBase<T extends string>({ label, subtitle, value, options, onChange, testID }: SelectRowProps<T>) {
  const selected = options.find((o) => o.value === value)?.label ?? String(value);
  return (
    <Row
      label={label}
      subtitle={subtitle}
      right={
        <Text style={styles.value} testID={(testID ?? 'select') + '-value'}>
          {selected}
        </Text>
      }
      onPress={() => {
        console.log('[Settings/Select] pressed', label);
        const idx = options.findIndex((o) => o.value === value);
        const next = options[(idx + 1) % options.length];
        onChange(next.value);
      }}
      testID={testID ?? 'select-row'}
    />
  );
}

export default memo(SelectRowBase) as typeof SelectRowBase;

const styles = StyleSheet.create({
  value: { fontSize: 16, color: '#6B7280' },
});