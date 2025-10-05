import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

test('React Native raw text under View should error in dev (lint prevents)', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  // Intentionally render text under View; RN would warn/error. Our lint rule prevents committing such code.
  render(
    // @ts-expect-error testing invalid JSX pattern
    <View>Text</View>
  );
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});
