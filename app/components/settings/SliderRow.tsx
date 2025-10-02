import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Row from './Row';

interface SliderRowProps {
  label: string;
  subtitle?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  testID?: string;
}

function SliderRowBase({ label, subtitle, value, min, max, step = 0.1, onChange, testID }: SliderRowProps) {
  return (
    <Row
      label={label}
      subtitle={subtitle}
      right={<Text style={styles.value}>{value.toFixed(2)}</Text>}
      onPress={() => {
        const range = max - min;
        const next = value + step;
        const wrapped = next > max ? min : next;
        onChange(Number(wrapped.toFixed(2)));
      }}
      testID={testID ?? 'slider-row'}
    />
  );
}

export default memo(SliderRowBase);

const styles = StyleSheet.create({
  value: { fontSize: 16, color: '#6B7280' },
});