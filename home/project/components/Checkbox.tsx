import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Check } from 'lucide-react-native';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'medium',
  color = '#007AFF',
  style,
  labelStyle,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const boxSize = getSize();
  const iconSize = boxSize * 0.7;

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled, style]}
      onPress={() => !disabled && onChange(!checked)}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            width: boxSize,
            height: boxSize,
            borderColor: checked ? color : '#C7C7CC',
            backgroundColor: checked ? color : 'transparent',
          },
        ]}
      >
        {checked && <Check size={iconSize} color="#FFFFFF" />}
      </View>
      {label && (
        <Text style={[styles.label, styles[`${size}Label`], labelStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
    color: '#000000',
  },
  smallLabel: {
    fontSize: 14,
  },
  mediumLabel: {
    fontSize: 16,
  },
  largeLabel: {
    fontSize: 18,
  },
});