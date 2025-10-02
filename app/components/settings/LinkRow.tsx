import React, { memo } from 'react';
import { Text } from 'react-native';
import Row from './Row';

interface LinkRowProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}

function LinkRowBase({ label, subtitle, onPress, testID }: LinkRowProps) {
  return (
    <Row
      label={label}
      subtitle={subtitle}
      onPress={onPress}
      right={<Text accessibilityElementsHidden>›</Text>}
      testID={testID ?? 'link-row'}
    />
  );
}

export default memo(LinkRowBase);