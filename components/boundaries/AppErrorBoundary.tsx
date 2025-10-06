import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppError, createAppError, getUserFriendlyMessage } from '@/lib/errors/AppError';
import { trackError } from '@/observability/telemetry';

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void; reset: () => void }>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
  retryCount: number;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  private maxRetries = 3;
  
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    const appError = createAppError(
      'UnknownError',
      error.message || 'An unexpected error occurred',
      {
        cause: error,
        context: {
          component: 'AppErrorBoundary',
          stack: error.stack,
        },
      }
    );

    return {
      hasError: true,
      error: appError,
      errorId: appError.errorId,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const appError = createAppError(
        'UnknownError',
        error.message || 'An unexpected error occurred',
        {
          cause: error,
          context: {
            component: 'AppErrorBoundary',
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount,
          },
        }
      );

      // Track error for observability
      await trackError('react_boundary', {
        message: error.message,
        componentStack: errorInfo.componentStack,
        errorId: appError.errorId,
        retryCount: this.state.retryCount,
      });

      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(appError, errorInfo);
      }
    } catch (handlingError) {
      console.error('[AppErrorBoundary] Failed to handle error:', handlingError);
    }
  }

  retry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'The app has encountered persistent issues. Please restart the application.',
        [{ text: 'OK' }]
      );
      return;
    }

    await trackError('error_boundary_retry', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
    });

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    });
  };

  reportIssue = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.cause instanceof Error ? this.state.error.cause.stack : undefined,
      retryCount: this.state.retryCount,
      timestamp: this.state.error?.timestamp,
    };

    // In a real app, this would open a bug report form or email
    Alert.alert(
      'Report Issue',
      `Error ID: ${this.state.errorId}\n\nPlease share this error ID with support for faster resolution.`,
      [
        { text: 'Copy Error ID', onPress: () => {
          // Copy to clipboard
          console.log('Error ID copied:', this.state.errorId);
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.retry}
            reset={this.reset}
          />
        );
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            
            <Text style={styles.title}>Something went wrong</Text>
            
            <Text style={styles.message}>
              {getUserFriendlyMessage(this.state.error)}
            </Text>
            
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>Error ID: {this.state.errorId}</Text>
                <Text style={styles.debugText}>Type: {this.state.error.code}</Text>
                <Text style={styles.debugText}>Retry Count: {this.state.retryCount}</Text>
                {this.state.error.cause instanceof Error && this.state.error.cause.stack && (
                  <Text style={styles.debugText} numberOfLines={5}>
                    Stack: {this.state.error.cause.stack}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              {this.state.retryCount < this.maxRetries && (
                <TouchableOpacity
                  testID="error-retry"
                  onPress={this.retry}
                  style={[styles.button, styles.retryButton]}
                >
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                testID="error-reset"
                onPress={this.reset}
                style={[styles.button, styles.resetButton]}
              >
                <Text style={styles.buttonText}>Reset App</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="error-report"
              onPress={this.reportIssue}
              style={[styles.button, styles.reportButton]}
            >
              <Text style={styles.buttonText}>Report Issue</Text>
            </TouchableOpacity>
            
            {this.state.retryCount >= this.maxRetries && (
              <Text style={styles.maxRetriesText}>
                Maximum retry attempts reached. Please restart the app.
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }
    
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
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
  },
  debugInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#10B981',
  },
  resetButton: {
    backgroundColor: '#6B7280',
  },
  reportButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  maxRetriesText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});