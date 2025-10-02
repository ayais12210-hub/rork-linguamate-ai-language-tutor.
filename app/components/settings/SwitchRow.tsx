import React, { memo } from 'react';
import { Switch, View } from 'react-native';
import Row from './Row';

interface SwitchRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
}

function SwitchRowBase({ label, subtitle, value, onChange, testID }: SwitchRowProps) {
  return (
    <Row
      label={label}
      subtitle={subtitle}
      right={<Switch value={value} onValueChange={onChange} testID={(testID ?? 'switch') + '-toggle'} />}
      testID={testID ?? 'switch-row'}
    />
  );
}

export default memo(SwitchRowBase);