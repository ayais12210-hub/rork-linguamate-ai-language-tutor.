import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorView } from '@/components/ErrorView';
import { AppError } from '@/lib/errors';

test('renders message and retries without console error', () => {
  const err = new AppError({ kind: 'Server', message: 'boom', requestId: 'ABC-123' });
  const onRetry = jest.fn();
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { getByTestId } = render(<ErrorView error={err} onRetry={onRetry} />);
  expect(screen.getByText('Something went wrong')).toBeTruthy();
  expect(screen.getByText('Server error. Please try again shortly.')).toBeTruthy();
  expect(screen.getByText('Request ID: ABC-123')).toBeTruthy();
  fireEvent.press(getByTestId('error-retry-btn'));
  expect(onRetry).toHaveBeenCalled();
  spy.mockRestore();
});
