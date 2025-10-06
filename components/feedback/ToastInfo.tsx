import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { AppError, getUserFriendlyMessage, getErrorSeverity } from '@/lib/errors/AppError';

interface ToastInfoProps {
  error: AppError | null;
  onDismiss?: () => void;
  duration?: number;
  style?: any;
}

export function ToastInfo({ error, onDismiss, duration = 5000, style }: ToastInfoProps) {
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (error) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [error, duration]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible || !error) return null;

  const severity = getErrorSeverity(error);
  const severityStyles = getSeverityStyles(severity);

  return (
    <Animated.View
      style={[
        styles.container,
        severityStyles.container,
        { opacity: fadeAnim },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handleDismiss}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, severityStyles.icon]}>
          {getSeverityIcon(severity)}
        </Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, severityStyles.title]}>
            {getSeverityTitle(severity)}
          </Text>
          <Text style={[styles.message, severityStyles.message]}>
            {getUserFriendlyMessage(error)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return 'ℹ️';
    case 'low':
    default:
      return '💡';
  }
}

function getSeverityTitle(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'Critical Error';
    case 'high':
      return 'Error';
    case 'medium':
      return 'Warning';
    case 'low':
    default:
      return 'Info';
  }
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        container: {
          backgroundColor: '#FEE2E2',
          borderLeftColor: '#DC2626',
        },
        icon: { color: '#DC2626' },
        title: { color: '#DC2626' },
        message: { color: '#991B1B' },
      };
    case 'high':
      return {
        container: {
          backgroundColor: '#FEF2F2',
          borderLeftColor: '#EF4444',
        },
        icon: { color: '#EF4444' },
        title: { color: '#EF4444' },
        message: { color: '#DC2626' },
      };
    case 'medium':
      return {
        container: {
          backgroundColor: '#FEF3C7',
          borderLeftColor: '#F59E0B',
        },
        icon: { color: '#F59E0B' },
        title: { color: '#F59E0B' },
        message: { color: '#D97706' },
      };
    case 'low':
    default:
      return {
        container: {
          backgroundColor: '#EFF6FF',
          borderLeftColor: '#3B82F6',
        },
        icon: { color: '#3B82F6' },
        title: { color: '#3B82F6' },
        message: { color: '#1E40AF' },
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
});