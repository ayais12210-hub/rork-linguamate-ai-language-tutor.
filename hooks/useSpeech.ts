import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Text-to-Speech Hook
 * 
 * Provides easy-to-use TTS functionality for pronunciation and lesson playback
 * 
 * Features:
 * - Language-specific pronunciation
 * - Adjustable speech rate and pitch
 * - Pause/resume support
 * - Queue management
 * - Works on iOS, Android, and Web
 * 
 * Usage:
 * ```tsx
 * const { speak, stop, isSpeaking } = useSpeech();
 * 
 * speak('Hello', { language: 'en-US' });
 * ```
 */

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voice?: string;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtteranceRef = useRef<string | null>(null);

  const speak = useCallback(async (text: string, options?: SpeechOptions) => {
    try {
      // Stop any current speech
      // Stop any current speech
      if (currentUtteranceRef.current) {
        await Speech.stop();
      }

      setIsSpeaking(true);

      setIsSpeaking(true);
      setIsPaused(false);
      currentUtteranceRef.current = text;

      const speechOptions: Speech.SpeechOptions = {
        language: options?.language || 'en-US',
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 1.0,
        volume: options?.volume ?? 1.0,
        voice: options?.voice,
        onDone: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          options?.onDone?.();
        },
        onStopped: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          options?.onStopped?.();
        },
        onError: (error) => {
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          console.error('[useSpeech] Error:', error);
          options?.onError?.(new Error(error.error));
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('[useSpeech] Failed to speak:', error);
      setIsSpeaking(false);
      setIsPaused(false);
      options?.onError?.(error as Error);
    }
  }, [isSpeaking]);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    } catch (error) {
      console.error('[useSpeech] Failed to stop:', error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      // Note: Pause is iOS only
      if (Platform.OS === 'ios') {
        await Speech.pause();
        setIsPaused(true);
      } else {
        console.warn('[useSpeech] Pause is only supported on iOS');
      }
    } catch (error) {
      console.error('[useSpeech] Failed to pause:', error);
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      // Note: Resume is iOS only
      if (Platform.OS === 'ios') {
        await Speech.resume();
        setIsPaused(false);
      } else {
        console.warn('[useSpeech] Resume is only supported on iOS');
      }
    } catch (error) {
      console.error('[useSpeech] Failed to resume:', error);
    }
  }, []);

  const getAvailableVoices = useCallback(async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('[useSpeech] Failed to get voices:', error);
      return [];
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    currentText: currentUtteranceRef.current,
    getAvailableVoices,
  };
}

/**
 * Get language-specific speech options
 */
export const getLanguageSpeechOptions = (languageCode: string): Partial<SpeechOptions> => {
  const languageMap: Record<string, Partial<SpeechOptions>> = {
    'en': { language: 'en-US', rate: 1.0, pitch: 1.0 },
    'pa': { language: 'pa-IN', rate: 0.9, pitch: 1.0 },
    'hi': { language: 'hi-IN', rate: 0.95, pitch: 1.0 },
    'es': { language: 'es-ES', rate: 0.95, pitch: 1.0 },
    'fr': { language: 'fr-FR', rate: 0.95, pitch: 1.0 },
    'de': { language: 'de-DE', rate: 0.9, pitch: 1.0 },
    'zh': { language: 'zh-CN', rate: 0.9, pitch: 1.0 },
    'ja': { language: 'ja-JP', rate: 0.9, pitch: 1.0 },
    'ko': { language: 'ko-KR', rate: 0.9, pitch: 1.0 },
  };

  return languageMap[languageCode] || { language: 'en-US', rate: 1.0, pitch: 1.0 };
};
