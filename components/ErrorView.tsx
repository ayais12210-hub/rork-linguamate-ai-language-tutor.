import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppError } from '@/lib/errors';

export function ErrorView({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  const short = messageFor(error);
  return (
    <View style={styles.container} testID="error-view">
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{short}</Text>
      {error.requestId ? (
        <Text style={styles.hint}>Request ID: {error.requestId}</Text>
      ) : null}
      {onRetry ? (
        <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.button} testID="error-retry-btn">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function messageFor(err: AppError): string {
  switch (err.kind) {
    case 'Network':
      return "Can't reach server right now.";
    case 'Validation':
      return 'Received invalid data. Please try again.';
    case 'Auth':
      return 'Please sign in to continue.';
    case 'Server':
      return 'Server error. Please try again shortly.';
    default:
      return 'Unexpected error occurred.';
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  message: { fontSize: 14, color: '#4b5563', textAlign: 'center' },
  hint: { fontSize: 12, color: '#6b7280' },
  button: { marginTop: 8, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
});

export default ErrorView;
