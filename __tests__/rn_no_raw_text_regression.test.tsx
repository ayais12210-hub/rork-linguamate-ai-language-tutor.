import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import Row from '@/app/components/settings/Row';

describe('React Native raw text regression', () => {
  it('does not log error for wrapped text under View', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <View>
          <Text>Hello</Text>
          <Row label="Label" subtitle="Sub" />
        </View>
      );
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
