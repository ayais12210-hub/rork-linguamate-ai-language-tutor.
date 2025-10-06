import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppError, getUserFriendlyMessage, isValidationError } from '@/lib/errors/AppError';

interface FormErrorProps {
  error: AppError | null;
  field?: string;
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
}

export function FormError({ error, field, style, textStyle, showIcon = true }: FormErrorProps) {
  if (!error) return null;

  // For validation errors, show field-specific message if available
  const message = isValidationError(error) && field && error.context?.field === field
    ? error.message
    : getUserFriendlyMessage(error);

  return (
    <View style={[styles.container, style]}>
      {showIcon && <Text style={styles.icon}>⚠️</Text>}
      <Text style={[styles.text, textStyle]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginTop: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 18,
  },
});