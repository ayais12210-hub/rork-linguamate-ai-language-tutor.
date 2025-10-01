import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

// Native fallback without CSS. We simulate a glowing border using two absolutely
// positioned Views. This keeps parity with web while remaining Expo Go friendly.

export type StarBorderProps = ViewProps & {
  thickness?: number;
  color?: string;
};

export default function StarBorder({
  style,
  thickness = 1,
  color = '#FFFFFF',
  children,
  ...rest
}: StarBorderProps) {
  return (
    <View {...rest} style={[styles.container, style]} accessibilityRole="button" testID="star-border-native">
      <View style={[styles.border, { height: thickness }]} />
      <View style={[styles.inner]}>{children}</View>
      <View style={[styles.border, { height: thickness }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  border: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  inner: {
    width: '100%',
  },
});
