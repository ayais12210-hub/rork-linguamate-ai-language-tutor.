import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  margin?: number;
  text?: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = '#E5E5EA',
  margin = 0,
  text,
  textStyle,
  style,
}) => {
  if (text && orientation === 'horizontal') {
    return (
      <View style={[styles.textContainer, { marginVertical: margin }, style]}>
        <View
          style={[
            styles.line,
            {
              backgroundColor: color,
              height: thickness,
              flex: 1,
            },
          ]}
        />
        <Text style={[styles.text, textStyle]}>{text}</Text>
        <View
          style={[
            styles.line,
            {
              backgroundColor: color,
              height: thickness,
              flex: 1,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        {
          backgroundColor: color,
          [orientation === 'horizontal' ? 'height' : 'width']: thickness,
          [orientation === 'horizontal' ? 'marginVertical' : 'marginHorizontal']: margin,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    marginHorizontal: 8,
  },
  text: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 12,
  },
});