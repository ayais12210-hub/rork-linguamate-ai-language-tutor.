import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onColor?: string;
  offColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  size = 'medium',
  onColor = '#34C759',
  offColor = '#E5E5EA',
  thumbColor = '#FFFFFF',
  style,
  labelStyle,
}) => {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const getSizes = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 20, thumbSize: 16, padding: 2 };
      case 'medium':
        return { width: 51, height: 31, thumbSize: 27, padding: 2 };
      case 'large':
        return { width: 60, height: 36, thumbSize: 32, padding: 2 };
      default:
        return { width: 51, height: 31, thumbSize: 27, padding: 2 };
    }
  };

  const { width, height, thumbSize, padding } = getSizes();
  const translateDistance = width - thumbSize - padding * 2;

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled, style]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {label && (
        <Text style={[styles.label, styles[`${size}Label`], labelStyle]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.track,
          {
            width,
            height,
            backgroundColor: value ? onColor : offColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              backgroundColor: thumbColor,
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [padding, translateDistance + padding],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
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
  label: {
    marginRight: 12,
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
  track: {
    borderRadius: 100,
    justifyContent: 'center',
  },
  thumb: {
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});