import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ProgressBarProps {
  progress: number;
  total?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  animated?: boolean;
  animationDuration?: number;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total = 100,
  showLabel = false,
  showPercentage = false,
  height = 8,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  borderRadius = 4,
  animated = true,
  animationDuration = 300,
  style,
  labelStyle,
  label,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(percentage);
    }
  }, [percentage, animated, animationDuration, animatedWidth]);

  return (
    <View style={[styles.container, style]}>
      {(showLabel || showPercentage) && (
        <View style={styles.labelContainer}>
          {showLabel && label && (
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, labelStyle]}>
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.progressContainer,
          {
            height,
            backgroundColor,
            borderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: color,
              borderRadius,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});