import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface BadgeProps {
  text: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  dot = false,
  style,
  textStyle,
}) => {
  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          styles[`${variant}Dot`],
          styles[`${size}Dot`],
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles[variant],
        styles[`${size}Container`],
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          styles[`${size}Text`],
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#E5E5EA',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  success: {
    backgroundColor: '#34C759',
  },
  warning: {
    backgroundColor: '#FF9500',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  info: {
    backgroundColor: '#5856D6',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontWeight: '600',
  },
  defaultText: {
    color: '#000000',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  successText: {
    color: '#FFFFFF',
  },
  warningText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  infoText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
  dot: {
    borderRadius: 50,
  },
  defaultDot: {
    backgroundColor: '#E5E5EA',
  },
  primaryDot: {
    backgroundColor: '#007AFF',
  },
  successDot: {
    backgroundColor: '#34C759',
  },
  warningDot: {
    backgroundColor: '#FF9500',
  },
  dangerDot: {
    backgroundColor: '#FF3B30',
  },
  infoDot: {
    backgroundColor: '#5856D6',
  },
  smallDot: {
    width: 6,
    height: 6,
  },
  mediumDot: {
    width: 8,
    height: 8,
  },
  largeDot: {
    width: 10,
    height: 10,
  },
});