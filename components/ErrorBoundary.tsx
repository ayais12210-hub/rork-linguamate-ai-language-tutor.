import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ErrorBoundaryHelper, AppError } from '@/lib/error-handling';
import { DebugLogger } from '@/lib/debugging';
import { PerformanceMonitor } from '@/lib/monitoring';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
  retryCount: number;
}

// Enhanced Error Boundary with comprehensive error handling
export default class ErrorBoundary extends React.Component<Props, State> {
  private maxRetries = 3;
  
  state: State = {
    hasError: false,
    error: null,
    errorId: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorBoundaryHelper.createErrorInfo(error, { componentStack: '' });
    return {
      hasError: true,
      error: appError,
      errorId: appError.errorId,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // Create comprehensive error info
      const appError = ErrorBoundaryHelper.createErrorInfo(error, errorInfo);
      
      // Log to debug system
      await DebugLogger.error(
        'ErrorBoundary',
        `React Error Boundary caught error: ${error.message}`,
        {
          error: appError.toJSON(),
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount,
        },
        error
      );
      
      // Track performance impact
      PerformanceMonitor.trackCrash(appError);
      
      // Handle error through our error handling system
      await ErrorBoundaryHelper.handleBoundaryError(error, errorInfo);
      
      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(appError, errorInfo);
      }
      
    } catch (handlingError) {
      if (__DEV__) {

        console.error('[ErrorBoundary] Failed to handle error:', handlingError);

      }
    }
  }

  retry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      await DebugLogger.warn(
        'ErrorBoundary',
        'Max retry attempts reached',
        { errorId: this.state.errorId, retryCount: this.state.retryCount }
      );
      return;
    }

    await DebugLogger.info(
      'ErrorBoundary',
      'Retrying after error',
      { errorId: this.state.errorId, retryCount: this.state.retryCount + 1 }
    );

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

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
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
              {this.state.error.getUserMessage()}
            </Text>
            
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>Error ID: {this.state.errorId}</Text>
                <Text style={styles.debugText}>Type: {this.state.error.type}</Text>
                <Text style={styles.debugText}>Severity: {this.state.error.severity}</Text>
                <Text style={styles.debugText}>Retry Count: {this.state.retryCount}</Text>
                {this.state.error.stack && (
                  <Text style={styles.debugText} numberOfLines={5}>
                    Stack: {this.state.error.stack}
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