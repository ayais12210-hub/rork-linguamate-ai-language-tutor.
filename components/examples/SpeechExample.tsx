import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSpeech } from '@/hooks/useSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { analyticsEvents } from '@/app/providers/AnalyticsProvider';

/**
 * Example: Speech Features (TTS + STT)
 * 
 * Demonstrates text-to-speech and speech-to-text functionality
 * for pronunciation practice.
 */
export function SpeechExample() {
  const { speak, stop, isSpeaking } = useSpeech();
  const { start, stop: stopRecording, result, isRecording } = useSpeechRecognition();
  const [transcription, setTranscription] = useState('');

  const handleSpeak = () => {
    const text = 'Hello, welcome to LinguaMate!';
    speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => {
        analyticsEvents.ttsUsed(text, 'en-US');
      },
    });
  };

  const handleStartRecording = async () => {
    try {
      await start({ language: 'en-US' });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      if (result) {
        setTranscription(result);
        analyticsEvents.wordHeard(result, 'en-US', true);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Speech Features</Text>
      
      {/* Text-to-Speech */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text-to-Speech</Text>
        <TouchableOpacity
          style={[styles.button, isSpeaking && styles.buttonActive]}
          onPress={isSpeaking ? stop : handleSpeak}
        >
          <Text style={styles.buttonText}>
            {isSpeaking ? '⏸ Stop Speaking' : '🔊 Speak'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Speech-to-Text */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speech-to-Text</Text>
        <TouchableOpacity
          style={[styles.button, isRecording && styles.buttonRecording]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
          </Text>
        </TouchableOpacity>
        {transcription && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Transcription:</Text>
            <Text style={styles.resultText}>{transcription}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF9500',
  },
  buttonRecording: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 16,
  },
});
