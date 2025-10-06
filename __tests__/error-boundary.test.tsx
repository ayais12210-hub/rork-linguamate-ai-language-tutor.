import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

// Component that throws an error
import { View, Text } from 'react-native';

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
      <ErrorBoundary fallback={<div testID="error-fallback">Error occurred</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeTruthy();
    expect(screen.queryByTestId('no-error')).toBeNull();
  });

  it('should call retry function when retry button is pressed', () => {
    const mockRetry = jest.fn();
    
    render(
      <ErrorBoundary 
        fallback={({ retry }) => (
          <div testID="error-fallback">
            <button testID="retry-button" onPress={retry}>Retry</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.press(retryButton);
    
    expect(mockRetry).toHaveBeenCalled();
  });
});
