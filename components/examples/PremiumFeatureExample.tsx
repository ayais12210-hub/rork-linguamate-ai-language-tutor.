import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useRouter } from 'expo-router';

/**
 * Example: Premium Feature Gate
 * 
 * Shows how to gate features behind a premium subscription
 * using RevenueCat entitlements.
 */
export function PremiumFeatureExample() {
  const { isPremium, loading } = usePremiumGate();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Checking subscription...</Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⭐ Premium Feature</Text>
        <Text style={styles.text}>
          This feature requires a premium subscription.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/subscription')}
        >
          <Text style={styles.buttonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Premium Feature Unlocked!</Text>
      <Text style={styles.text}>
        You have access to all premium features.
      </Text>
      {/* Your premium feature content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
