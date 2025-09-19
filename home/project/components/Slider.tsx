import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  trackColor?: string;
  minimumTrackColor?: string;
  maximumTrackColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  showValue = false,
  disabled = false,
  trackColor = '#E5E5EA',
  minimumTrackColor = '#007AFF',
  maximumTrackColor,
  thumbColor = '#FFFFFF',
  style,
  labelStyle,
  valueStyle,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;

  const percentage = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = percentage * sliderWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        pan.setOffset(thumbPosition);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(sliderWidth, thumbPosition + gestureState.dx));
        const newPercentage = newPosition / sliderWidth;
        const newValue = minimumValue + newPercentage * (maximumValue - minimumValue);
        const steppedValue = Math.round(newValue / step) * step;
        onValueChange(Math.max(minimumValue, Math.min(maximumValue, steppedValue)));
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      {(label || showValue) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          )}
          {showValue && (
            <Text style={[styles.value, valueStyle]}>{value}</Text>
          )}
        </View>
      )}
      <View
        style={styles.sliderContainer}
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
      >
        <View
          style={[
            styles.track,
            {
              backgroundColor: maximumTrackColor || trackColor,
            },
          ]}
        />
        <View
          style={[
            styles.minimumTrack,
            {
              width: `${percentage * 100}%`,
              backgroundColor: minimumTrackColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              left: thumbPosition - 10,
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  minimumTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
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