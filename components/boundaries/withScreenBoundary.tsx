import React, { Component, ComponentType } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppError, createAppError, getUserFriendlyMessage } from '@/lib/errors/AppError';
import { trackError } from '@/observability/telemetry';

interface ScreenBoundaryProps {
  onError?: (error: AppError) => void;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  screenName: string;
}

interface ScreenBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export function withScreenBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  screenName: string
) {
  class ScreenErrorBoundary extends Component<
    P & ScreenBoundaryProps,
    ScreenBoundaryState
  > {
    state: ScreenBoundaryState = {
      hasError: false,
      error: null,
    };

    static getDerivedStateFromError(error: Error): Partial<ScreenBoundaryState> {
      const appError = createAppError(
        'UnknownError',
        error.message || 'An unexpected error occurred in screen',
        {
          cause: error,
          context: {
            screen: screenName,
            component: 'ScreenErrorBoundary',
            stack: error.stack,
          },
        }
      );

      return {
        hasError: true,
        error: appError,
      };
    }

    async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      try {
        const appError = createAppError(
          'UnknownError',
          error.message || 'An unexpected error occurred in screen',
          {
            cause: error,
            context: {
              screen: screenName,
              component: 'ScreenErrorBoundary',
              componentStack: errorInfo.componentStack,
            },
          }
        );

        // Track error for observability
        await trackError('screen_boundary', {
          screen: screenName,
          errorMessage: error.message,
          error: appError,
          context: {
            componentStack: errorInfo.componentStack,
          },
          errorId: appError.errorId,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
          this.props.onError(appError);
        }
      } catch (handlingError) {
        console.error(`[ScreenErrorBoundary:${screenName}] Failed to handle error:`, handlingError);
      }
    }

    retry = () => {
      this.setState({
        hasError: false,
        error: null,
      });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        // Use custom fallback component if provided
        if (this.props.fallback) {
          const FallbackComponent = this.props.fallback;
          return <FallbackComponent error={this.state.error} retry={this.retry} />;
        }

        // Default screen error UI
        return (
          <View style={styles.container}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            
            <Text style={styles.title}>Screen Error</Text>
            
            <Text style={styles.message}>
              {getUserFriendlyMessage(this.state.error)}
            </Text>
            
            <Text style={styles.screenInfo}>
              Screen: {screenName}
            </Text>
            
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>Error ID: {this.state.error.errorId}</Text>
                <Text style={styles.debugText}>Type: {this.state.error.code}</Text>
                {this.state.error.cause instanceof Error && this.state.error.cause.stack && (
                  <Text style={styles.debugText} numberOfLines={3}>
                    Stack: {this.state.error.cause.stack}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity
              testID="screen-error-retry"
              onPress={this.retry}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      return <WrappedComponent {...(this.props as P)} />;
    }
  }

  // Set display name for debugging
  ScreenErrorBoundary.displayName = `withScreenBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ScreenErrorBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  screenInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  debugInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});