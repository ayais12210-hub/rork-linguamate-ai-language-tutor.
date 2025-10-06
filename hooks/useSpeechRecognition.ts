import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Speech-to-Text Hook
 * 
 * Provides speech recognition for pronunciation practice and voice input
 * 
 * Note: This requires expo-speech-recognition or @react-native-voice/voice
 * Currently returns a mock implementation. Replace with actual SDK once installed.
 * 
 * Features:
 * - Real-time transcription
 * - Language-specific recognition
 * - Continuous vs single-shot modes
 * - Confidence scores
 * 
 * Usage:
 * ```tsx
 * const { start, stop, result, isRecording } = useSpeechRecognition();
 * 
 * await start({ language: 'en-US' });
 * // User speaks...
 * await stop();
 * console.log(result); // Transcribed text
 * ```
 */

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [results, setResults] = useState<SpeechRecognitionResult[]>([]);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = useCallback(async () => {
    // TODO: Replace with actual SDK availability check
    // For expo-speech-recognition:
    // import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
    // const available = await ExpoSpeechRecognitionModule.getStateAsync();
    
    // For now, assume available on supported platforms
    setIsAvailable(Platform.OS === 'ios' || Platform.OS === 'android');
  }, []);

  const start = useCallback(async (options?: SpeechRecognitionOptions) => {
    try {
      if (!isAvailable) {
        throw new Error('Speech recognition is not available on this device');
      }

      setError(null);
      setResult('');
      setResults([]);
      setIsRecording(true);

      // TODO: Replace with actual SDK implementation
      // For expo-speech-recognition:
      // import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
      // await ExpoSpeechRecognitionModule.start({
      //   lang: options?.language || 'en-US',
      //   interimResults: options?.interimResults ?? true,
      //   maxAlternatives: options?.maxAlternatives ?? 5,
      //   continuous: options?.continuous ?? false,
      // });

      console.log('[useSpeechRecognition] Started with options:', options);
      
      // Mock implementation - remove this in production
      if (__DEV__) {
        console.warn('[useSpeechRecognition] Using mock implementation. Install expo-speech-recognition or @react-native-voice/voice for actual functionality.');
      }
    } catch (err) {
      console.error('[useSpeechRecognition] Failed to start:', err);
      setError(err as Error);
      setIsRecording(false);
      throw err;
    }
  }, [isAvailable]);

  const stop = useCallback(async () => {
    try {
      // TODO: Replace with actual SDK implementation
      // For expo-speech-recognition:
      // import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
      // await ExpoSpeechRecognitionModule.stop();

      setIsRecording(false);
      console.log('[useSpeechRecognition] Stopped');
    } catch (err) {
      console.error('[useSpeechRecognition] Failed to stop:', err);
      setError(err as Error);
      setIsRecording(false);
      throw err;
    }
  }, []);

  const abort = useCallback(async () => {
    try {
      // TODO: Replace with actual SDK implementation
      // For expo-speech-recognition:
      // import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
      // await ExpoSpeechRecognitionModule.abort();

      setIsRecording(false);
      setResult('');
      setResults([]);
      console.log('[useSpeechRecognition] Aborted');
    } catch (err) {
      console.error('[useSpeechRecognition] Failed to abort:', err);
      setError(err as Error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      // TODO: Replace with actual SDK implementation
      // For expo-speech-recognition:
      // import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
      // const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      // return status === 'granted';

      console.log('[useSpeechRecognition] Requesting permissions');
      return true; // Mock
    } catch (err) {
      console.error('[useSpeechRecognition] Failed to request permissions:', err);
      return false;
    }
  }, []);

  return {
    start,
    stop,
    abort,
    result,
    results,
    isRecording,
    isAvailable,
    error,
    requestPermissions,
  };
}

/**
 * Calculate similarity between expected and actual speech
 * Useful for pronunciation scoring
 */
export function calculateSpeechAccuracy(expected: string, actual: string): number {
  const normalizedExpected = expected.toLowerCase().trim();
  const normalizedActual = actual.toLowerCase().trim();

  if (normalizedExpected === normalizedActual) {
    return 1.0;
  }

  // Simple Levenshtein distance-based similarity
  const distance = levenshteinDistance(normalizedExpected, normalizedActual);
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length);
  const similarity = 1 - distance / maxLength;

  return Math.max(0, similarity);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
