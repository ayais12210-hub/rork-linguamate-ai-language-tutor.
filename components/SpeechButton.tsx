import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useSpeechToText } from '@/hooks/useSpeechToText';

export default function SpeechButton({
  onText,
}: {
  onText?: (t: string) => void;
}) {
  const stt = useSpeechToText();

  React.useEffect(() => {
    if (!onText) return;
    return stt.onTranscript(onText);
  }, [onText, stt]);

  if (!stt.supported) {
    return (
      <Pressable style={[styles.button, styles.disabled]} disabled>
        <Text style={styles.text}>STT unavailable</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={stt.listening ? stt.stop : stt.start}
      style={[styles.button, stt.listening ? styles.recording : styles.ready]}
    >
      <Text style={styles.text}>
        {stt.listening ? 'Stop Recording' : 'Start Speaking'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  disabled: {
    backgroundColor: '#27272a',
    opacity: 0.6,
  },
  recording: {
    backgroundColor: '#dc2626',
  },
  ready: {
    backgroundColor: '#059669',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600' as const,
  },
});
