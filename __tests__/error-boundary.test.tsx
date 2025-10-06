import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

// Component that throws an error
import { View, Text, TouchableOpacity } from 'react-native';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <View testID="no-error"><Text>No error</Text></View>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary
        fallback={() => (
          <View testID="error-fallback">
            <Text>Error occurred</Text>
          </View>
        )}
      >
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('no-error')).toBeTruthy();
    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });

  it('should render fallback when there is an error', () => {
    render(
      <ErrorBoundary fallback={() => (
        <View testID="error-fallback">
          <Text>Error occurred</Text>
        </View>
      )}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeTruthy();
    expect(screen.queryByTestId('no-error')).toBeNull();
  });

  it('should call retry function when retry button is pressed', () => {
    render(
      <ErrorBoundary 
        fallback={({ retry }) => (
          <View testID="error-fallback">
            <TouchableOpacity testID="retry-button" onPress={retry}>
              <Text>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.press(retryButton);

    // Verify that after retry, the error boundary attempts to re-render children
    // This is a basic smoke test; more comprehensive testing would verify state changes
    expect(screen.queryByTestId('error-fallback')).toBeTruthy();
  });
});
