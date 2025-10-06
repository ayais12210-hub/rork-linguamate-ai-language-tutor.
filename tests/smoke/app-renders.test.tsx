import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// Simple smoke test to ensure the test environment works
describe('App Smoke Test', () => {
  it('should render a basic component', () => {
    const TestComponent = () => {
      return <View><Text>Test</Text></View>;
    };
    const { getByText } = render(<TestComponent />);
    expect(getByText('Test')).toBeTruthy();
  });
});