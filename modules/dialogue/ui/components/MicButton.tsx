import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';

type Props = {
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  testID?: string;
};

export default function MicButton({ onStart, onStop, disabled, testID = 'mic-btn' }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handlePress = () => {
    if (isRecording) {
      setIsRecording(false);
      onStop();
    } else {
      setIsRecording(true);
      onStart();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      accessibilityRole="button"
      testID={testID}
    >
      <Animated.View style={[styles.inner, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.circle, isRecording && styles.recording]}>
          <Text style={styles.icon}>{isRecording ? '⏹' : '🎤'}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  recording: {
    backgroundColor: '#FF3B30',
  },
  icon: {
    fontSize: 28,
  },
});
