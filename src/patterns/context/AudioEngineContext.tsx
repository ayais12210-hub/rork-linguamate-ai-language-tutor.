import React, { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { z } from 'zod';

// Audio engine configuration schema
const AudioConfigSchema = z.object({
  provider: z.enum(['elevenlabs', 'aws', 'google', 'expo']).default('expo'),
  apiKey: z.string().optional(),
  region: z.string().optional(),
  voiceId: z.string().default('default'),
  language: z.string().default('en-US'),
  rate: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  volume: z.number().min(0.0).max(1.0).default(1.0),
});

export type AudioConfig = z.infer<typeof AudioConfigSchema>;

// Audio engine interface
export interface AudioEngine {
  speak: (text: string, options?: Partial<AudioConfig>) => Promise<void>;
  transcribe: (audioBlob: Blob, options?: Partial<AudioConfig>) => Promise<string>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  isSupported: () => boolean;
  getAvailableVoices: () => Promise<Array<{ id: string; name: string; language: string }>>;
}

// Context type
interface AudioEngineContextType {
  engine: AudioEngine;
  config: AudioConfig;
  isSpeaking: boolean;
  isTranscribing: boolean;
  error: string | null;
  setConfig: (config: Partial<AudioConfig>) => void;
  setProvider: (provider: AudioConfig['provider']) => void;
  clearError: () => void;
}

// Create context
const AudioEngineContext = createContext<AudioEngineContextType | undefined>(undefined);

// Default audio engine implementation using Expo Speech
class ExpoAudioEngine implements AudioEngine {
  private isCurrentlySpeaking = false;
  private isCurrentlyTranscribing = false;

  async speak(text: string, options: Partial<AudioConfig> = {}): Promise<void> {
    try {
      this.isCurrentlySpeaking = true;
      
      // Import expo-speech dynamically to avoid issues in non-Expo environments
      const { speak: expoSpeak } = await import('expo-speech');
      
      await expoSpeak(text, {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 1.0,
        volume: options.volume || 1.0,
        voice: options.voiceId,
      });
    } catch (error) {
      throw new Error(`Speech synthesis failed: ${error}`);
    } finally {
      this.isCurrentlySpeaking = false;
    }
  }

  async transcribe(audioBlob: Blob, options: Partial<AudioConfig> = {}): Promise<string> {
    try {
      this.isCurrentlyTranscribing = true;
      
      // Import expo-speech-recognition dynamically
      const { startListening, stopListening } = await import('expo-speech-recognition');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transcription timeout'));
        }, 30000); // 30 second timeout

        startListening({
          language: options.language || 'en-US',
          onResult: (result) => {
            clearTimeout(timeout);
            this.isCurrentlyTranscribing = false;
            resolve(result);
          },
          onError: (error) => {
            clearTimeout(timeout);
            this.isCurrentlyTranscribing = false;
            reject(new Error(`Transcription failed: ${error}`));
          },
        });

        // Stop listening after 10 seconds or when audio ends
        setTimeout(() => {
          stopListening();
        }, 10000);
      });
    } catch (error) {
      this.isCurrentlyTranscribing = false;
      throw new Error(`Speech recognition failed: ${error}`);
    }
  }

  async stop(): Promise<void> {
    try {
      const { stop: stopSpeaking } = await import('expo-speech');
      const { stopListening } = await import('expo-speech-recognition');
      
      await Promise.all([
        stopSpeaking(),
        stopListening(),
      ]);
      
      this.isCurrentlySpeaking = false;
      this.isCurrentlyTranscribing = false;
    } catch (error) {
      throw new Error(`Stop failed: ${error}`);
    }
  }

  async pause(): Promise<void> {
    try {
      const { pause: pauseSpeaking } = await import('expo-speech');
      await pauseSpeaking();
    } catch (error) {
      throw new Error(`Pause failed: ${error}`);
    }
  }

  async resume(): Promise<void> {
    try {
      const { resume: resumeSpeaking } = await import('expo-speech');
      await resumeSpeaking();
    } catch (error) {
      throw new Error(`Resume failed: ${error}`);
    }
  }

  isSupported(): boolean {
    return true; // Expo Speech is supported on all platforms
  }

  async getAvailableVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const { getAvailableVoices } = await import('expo-speech');
      const voices = await getAvailableVoices();
      return voices.map(voice => ({
        id: voice.identifier,
        name: voice.name,
        language: voice.language,
      }));
    } catch (error) {
      console.warn('Failed to get available voices:', error);
      return [];
    }
  }
}

// Provider component
interface AudioEngineProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AudioConfig>;
  customEngine?: AudioEngine;
}

export function AudioEngineProvider({ 
  children, 
  initialConfig = {},
  customEngine 
}: AudioEngineProviderProps) {
  const [config, setConfigState] = React.useState<AudioConfig>(() => 
    AudioConfigSchema.parse(initialConfig)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  // Create engine instance
  const engine = useMemo(() => {
    if (customEngine) return customEngine;
    return new ExpoAudioEngine();
  }, [customEngine]);

  // Wrapped engine with state tracking
  const wrappedEngine = useMemo(() => ({
    ...engine,
    speak: async (text: string, options?: Partial<AudioConfig>) => {
      try {
        setError(null);
        setIsSpeaking(true);
        await engine.speak(text, { ...config, ...options });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsSpeaking(false);
      }
    },
    transcribe: async (audioBlob: Blob, options?: Partial<AudioConfig>) => {
      try {
        setError(null);
        setIsTranscribing(true);
        const result = await engine.transcribe(audioBlob, { ...config, ...options });
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsTranscribing(false);
      }
    },
  }), [engine, config]);

  const setConfig = useCallback((newConfig: Partial<AudioConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  const setProvider = useCallback((provider: AudioConfig['provider']) => {
    setConfig({ provider });
  }, [setConfig]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AudioEngineContextType = {
    engine: wrappedEngine,
    config,
    isSpeaking,
    isTranscribing,
    error,
    setConfig,
    setProvider,
    clearError,
  };

  return (
    <AudioEngineContext.Provider value={value}>
      {children}
    </AudioEngineContext.Provider>
  );
}

// Hook to use audio engine context
export function useAudioEngine(): AudioEngineContextType {
  const context = useContext(AudioEngineContext);
  if (context === undefined) {
    throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  }
  return context;
}

// Hook for just the engine
export function useAudioEngineInstance(): AudioEngine {
  const { engine } = useAudioEngine();
  return engine;
}

// Hook for audio configuration
export function useAudioConfig(): [AudioConfig, (config: Partial<AudioConfig>) => void] {
  const { config, setConfig } = useAudioEngine();
  return [config, setConfig];
}

export default AudioEngineContext;