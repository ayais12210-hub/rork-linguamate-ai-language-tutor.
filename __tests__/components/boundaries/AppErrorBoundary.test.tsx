import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AppErrorBoundary } from '@/components/boundaries/AppErrorBoundary';
import { AppError } from '@/lib/errors/AppError';
import { Alert } from 'react-native';

// Mock the telemetry module
jest.mock('@/observability/telemetry', () => ({
  trackError: jest.fn().mockResolvedValue(undefined),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Component that throws an error
const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('should display error UI when error is thrown', () => {
    const testError = new Error('Test error message');
    
    render(
      <AppErrorBoundary>
        <ThrowError error={testError} />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/Something went wrong/)).toBeTruthy();
  });

  it('should show retry button and allow retry', async () => {
    let shouldThrow = true;
    const RetryComponent = () => {
      if (shouldThrow) {
        throw new Error('Retryable error');
      }
      return <div>Success after retry</div>;
    };

    const { rerender } = render(
      <AppErrorBoundary>
        <RetryComponent />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    
    const retryButton = screen.getByTestId('error-retry');
    expect(retryButton).toBeTruthy();

    // Set up for successful retry
    shouldThrow = false;
    
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(screen.queryByText('Something went wrong')).toBeNull();
      expect(screen.getByText('Success after retry')).toBeTruthy();
    });
  });

  it('should limit retry attempts', async () => {
    const RetryComponent = () => {
      throw new Error('Persistent error');
    };

    render(
      <AppErrorBoundary>
        <RetryComponent />
      </AppErrorBoundary>
    );

    // Retry 3 times (the maximum)
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.queryByTestId('error-retry');
      expect(retryButton).toBeTruthy();
      fireEvent.press(retryButton!);
    }

    // After max retries, retry button should not be shown
    await waitFor(() => {
      expect(screen.queryByTestId('error-retry')).toBeNull();
      expect(screen.getByText(/Maximum retry attempts reached/)).toBeTruthy();
    });

    // Alert should be shown when trying to retry after max attempts
    expect(Alert.alert).toHaveBeenCalledWith(
      'Maximum Retries Reached',
      expect.any(String),
      expect.any(Array)
    );
  });

  it('should show reset button and allow reset', async () => {
    render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </AppErrorBoundary>
    );

    const resetButton = screen.getByTestId('error-reset');
    expect(resetButton).toBeTruthy();

    fireEvent.press(resetButton);

    // After reset, the error boundary should try to render children again
    // Since ThrowError will throw again, we'll see the error UI again
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeTruthy();
    });
  });

  it('should show report issue button and handle press', () => {
    render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </AppErrorBoundary>
    );

    const reportButton = screen.getByTestId('error-report');
    expect(reportButton).toBeTruthy();

    fireEvent.press(reportButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Report Issue',
      expect.stringContaining('Error ID:'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Copy Error ID' }),
        expect.objectContaining({ text: 'Cancel' }),
      ])
    );
  });

  it('should handle custom error handler', async () => {
    const customErrorHandler = jest.fn();
    const testError = new Error('Custom handler test');

    render(
      <AppErrorBoundary onError={customErrorHandler}>
        <ThrowError error={testError} />
      </AppErrorBoundary>
    );

    await waitFor(() => {
      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UnknownError',
          message: 'Custom handler test',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  it('should use custom fallback component if provided', () => {
    const CustomFallback: React.FC<{
      error: AppError;
      retry: () => void;
      reset: () => void;
    }> = ({ error, retry, reset }) => (
      <div>
        <div>Custom error: {error.message}</div>
        <button onPress={retry}>Custom Retry</button>
        <button onPress={reset}>Custom Reset</button>
      </div>
    );

    render(
      <AppErrorBoundary fallback={CustomFallback}>
        <ThrowError error={new Error('Test with custom fallback')} />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Custom error:/)).toBeTruthy();
    expect(screen.getByText('Custom Retry')).toBeTruthy();
    expect(screen.getByText('Custom Reset')).toBeTruthy();
  });

  it('should show debug information in development mode', () => {
    const originalDEV = __DEV__;
    Object.defineProperty(global, '__DEV__', {
      value: true,
      writable: true,
    });

    render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Debug test error')} />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Debug Information:')).toBeTruthy();
    expect(screen.getByText(/Error ID:/)).toBeTruthy();
    expect(screen.getByText(/Type:/)).toBeTruthy();
    expect(screen.getByText(/Retry Count:/)).toBeTruthy();

    Object.defineProperty(global, '__DEV__', {
      value: originalDEV,
      writable: true,
    });
  });
});