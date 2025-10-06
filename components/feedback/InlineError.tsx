import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppError, getUserFriendlyMessage } from '@/lib/errors/AppError';

interface InlineErrorProps {
  error: AppError | null;
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
}

export function InlineError({ error, style, textStyle, showIcon = true }: InlineErrorProps) {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      {showIcon && <Text style={styles.icon}>⚠️</Text>}
      <Text style={[styles.text, textStyle]}>
        {getUserFriendlyMessage(error)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});