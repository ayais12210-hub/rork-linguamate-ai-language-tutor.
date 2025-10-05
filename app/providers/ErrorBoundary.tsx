// Enhanced Error Boundary using new error system
import React from 'react';
import { AppError, toAppError } from '@/lib/errors';
import { log } from '@/lib/log';
import { isEnabled } from '@/lib/flags';
import ErrorView from '@/components/ErrorView';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  retryCount: number;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  private maxRetries = 3;
  private logger = log.scope('ErrorBoundary');
  
  state: State = {
    hasError: false,
    error: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = new AppError({
      kind: 'Unexpected',
      message: error.message,
      code: 'RENDER_ERROR',
      cause: error,
    });
    
    return {
      hasError: true,
      error: appError,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = toAppError(error);
    
    this.logger.error('React Error Boundary caught error', {
      error: appError.toJSON(),
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });
    
    // Send to Sentry if enabled
    if (isEnabled('sentry_integration')) {
      try {
        const Sentry = await import('@sentry/react-native').catch(() => null);
        if (Sentry) {
          Sentry.withScope((scope) => {
            scope.setTag('errorBoundary', true);
            scope.setContext('errorInfo', errorInfo);
            scope.setContext('appError', appError.toJSON());
            Sentry.captureException(error);
          });
        }
      } catch (sentryError) {
        this.logger.error('Failed to send error to Sentry', sentryError);
      }
    }
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  retry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      this.logger.warn('Max retry attempts reached', {
        retryCount: this.state.retryCount,
        maxRetries: this.maxRetries,
      });
      return;
    }

    this.logger.info('Retrying after error boundary catch', {
      retryCount: this.state.retryCount + 1,
    });

    this.setState({
      hasError: false,
      error: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
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

      // Use our enhanced ErrorView component
      return (
        <ErrorView
          error={this.state.error}
          onRetry={this.state.retryCount < this.maxRetries ? this.retry : undefined}
          onDismiss={this.reset}
          showTechnicalDetails={__DEV__ || isEnabled('debug_error_overlay')}
        />
      );
    }
    
    return this.props.children as React.ReactElement;
  }
}