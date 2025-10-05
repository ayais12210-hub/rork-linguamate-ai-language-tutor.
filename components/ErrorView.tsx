import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppError } from '@/lib/errors';

export function ErrorView({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  return (
    <View style={styles.container} testID="error-view">
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>{friendlyMessage(error)}</Text>
      {error.requestId ? (
        <Text style={styles.hint}>Request ID: {error.requestId}</Text>
      ) : null}
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function friendlyMessage(error: AppError): string {
  switch (error.kind) {
    case 'Network':
      return "Can't reach server right now.";
    case 'Auth':
      return 'You need to sign in again.';
    case 'Validation':
      return 'We received an unexpected response.';
    case 'Server':
      return 'Our server had a problem.';
    default:
      return 'An unexpected error occurred.';
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  hint: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  button: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
