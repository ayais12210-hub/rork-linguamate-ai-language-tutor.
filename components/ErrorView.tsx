/**
 * ErrorView Component
 * 
 * Reusable, pretty error display component with retry functionality
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppError } from '@/lib/error-handling';

export type ErrorViewProps = {
  error: AppError | Error | string;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
  fullScreen?: boolean;
  testID?: string;
};

export default function ErrorView({
  error,
  onRetry,
  retryText = 'Try Again',
  showDetails = __DEV__,
  fullScreen = false,
  testID = 'error-view',
}: ErrorViewProps): JSX.Element {
  // Normalize error
  const errorInfo = React.useMemo(() => {
    if (typeof error === 'string') {
      return {
        message: error,
        userMessage: error,
        details: undefined,
        errorId: undefined,
      };
    }
    
    if (error instanceof AppError) {
      return {
        message: error.message,
        userMessage: error.getUserMessage(),
        details: showDetails ? {
          type: error.type,
          severity: error.severity,
          errorId: error.errorId,
          stack: error.stack,
        } : undefined,
        errorId: error.errorId,
      };
    }
    
    // Regular Error
    return {
      message: error.message,
      userMessage: 'Something went wrong. Please try again.',
      details: showDetails ? {
        name: error.name,
        stack: error.stack,
      } : undefined,
      errorId: undefined,
    };
  }, [error, showDetails]);

  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]} testID={testID}>
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>

      {/* Error Message */}
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>{errorInfo.userMessage}</Text>

      {/* Error Details (dev only) */}
      {errorInfo.details && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Debug Information</Text>
          <ScrollView style={styles.detailsScroll}>
            {errorInfo.errorId && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Error ID: </Text>
                {errorInfo.errorId}
              </Text>
            )}
            {errorInfo.details.type && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Type: </Text>
                {errorInfo.details.type}
              </Text>
            )}
            {errorInfo.details.severity && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Severity: </Text>
                {errorInfo.details.severity}
              </Text>
            )}
            {errorInfo.details.name && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Name: </Text>
                {errorInfo.details.name}
              </Text>
            )}
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Message: </Text>
              {errorInfo.message}
            </Text>
            {errorInfo.details.stack && (
              <Text style={styles.detailText} numberOfLines={10}>
                <Text style={styles.detailLabel}>Stack: </Text>
                {errorInfo.details.stack}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          testID={`${testID}-retry-button`}
        >
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}

      {/* Help Text */}
      <Text style={styles.helpText}>
        If this problem persists, please contact support.
      </Text>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenWrapper}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
  fullScreenWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 400,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 200,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailsScroll: {
    maxHeight: 150,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
