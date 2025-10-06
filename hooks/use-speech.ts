import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  language: string;
  voice?: string;
  volume?: number;
  accent?: string;
  tone?: 'neutral' | 'friendly' | 'professional' | 'casual' | 'dramatic';
  emphasis?: 'normal' | 'strong' | 'subtle';
  pauseDuration?: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri?: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
  detectedLanguage?: string;
  alternatives?: string[];
  punctuation?: boolean;
  formatting?: 'none' | 'basic' | 'enhanced';
  timestamps?: Array<{ word: string; start: number; end: number }>;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  accent: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'senior';
  quality: 'standard' | 'premium' | 'neural';
  characteristics: string[];
  ssmlSupport: boolean;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  voices: VoiceProfile[];
  sttSupported: boolean;
  ttsSupported: boolean;
  autoDetection: boolean;
  punctuationRules?: {
    sentenceEndings: string[];
    questionMarks: string[];
    exclamationMarks: string[];
  };
}

interface Voice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

const defaultSpeechSettings: SpeechSettings = {
  rate: 1.0,
  pitch: 1.0,
  language: 'en-US',
  volume: 1.0,
  accent: 'us',
  tone: 'neutral',
  emphasis: 'normal',
  pauseDuration: 0.5,
};

// Comprehensive language configurations
const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'en-us-1',
        name: 'Sarah (Neural)',
        language: 'en-US',
        accent: 'us',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['clear', 'professional', 'warm'],
        ssmlSupport: true,
      },
      {
        id: 'en-us-2',
        name: 'Michael (Neural)',
        language: 'en-US',
        accent: 'us',
        gender: 'male',
        age: 'adult',
        quality: 'neural',
        characteristics: ['authoritative', 'friendly', 'clear'],
        ssmlSupport: true,
      },
    ],
    punctuationRules: {
      sentenceEndings: ['.', '!', '?'],
      questionMarks: ['?'],
      exclamationMarks: ['!'],
    },
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    nativeName: 'English',
    flag: '🇬🇧',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'en-gb-1',
        name: 'Emma (Neural)',
        language: 'en-GB',
        accent: 'british',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['elegant', 'clear', 'sophisticated'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    flag: '🇪🇸',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'es-es-1',
        name: 'Lucia (Neural)',
        language: 'es-ES',
        accent: 'spain',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['warm', 'expressive', 'clear'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'es-MX',
    name: 'Spanish (Mexico)',
    nativeName: 'Español',
    flag: '🇲🇽',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'es-mx-1',
        name: 'Mia (Neural)',
        language: 'es-MX',
        accent: 'mexican',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['friendly', 'energetic', 'clear'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français',
    flag: '🇫🇷',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'fr-fr-1',
        name: 'Lea (Neural)',
        language: 'fr-FR',
        accent: 'france',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['elegant', 'sophisticated', 'clear'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'de-de-1',
        name: 'Marlene (Neural)',
        language: 'de-DE',
        accent: 'germany',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['precise', 'professional', 'clear'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'it-IT',
    name: 'Italian (Italy)',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'it-it-1',
        name: 'Bianca (Neural)',
        language: 'it-IT',
        accent: 'italy',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['expressive', 'musical', 'warm'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português',
    flag: '🇧🇷',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'pt-br-1',
        name: 'Camila (Neural)',
        language: 'pt-BR',
        accent: 'brazil',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['friendly', 'energetic', 'clear'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'ja-JP',
    name: 'Japanese (Japan)',
    nativeName: '日本語',
    flag: '🇯🇵',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'ja-jp-1',
        name: 'Mizuki (Neural)',
        language: 'ja-JP',
        accent: 'japan',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['polite', 'clear', 'gentle'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'ko-KR',
    name: 'Korean (South Korea)',
    nativeName: '한국어',
    flag: '🇰🇷',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'ko-kr-1',
        name: 'Seoyeon (Neural)',
        language: 'ko-KR',
        accent: 'korea',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['clear', 'polite', 'warm'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '中文',
    flag: '🇨🇳',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'zh-cn-1',
        name: 'Xiaoxiao (Neural)',
        language: 'zh-CN',
        accent: 'mandarin',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['clear', 'expressive', 'natural'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية',
    flag: '🇸🇦',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'ar-sa-1',
        name: 'Hala (Neural)',
        language: 'ar-SA',
        accent: 'saudi',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['clear', 'elegant', 'expressive'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'hi-IN',
    name: 'Hindi (India)',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'hi-in-1',
        name: 'Aditi (Neural)',
        language: 'hi-IN',
        accent: 'india',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['warm', 'clear', 'expressive'],
        ssmlSupport: true,
      },
    ],
  },
  {
    code: 'ru-RU',
    name: 'Russian (Russia)',
    nativeName: 'Русский',
    flag: '🇷🇺',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [
      {
        id: 'ru-ru-1',
        name: 'Tatyana (Neural)',
        language: 'ru-RU',
        accent: 'russia',
        gender: 'female',
        age: 'adult',
        quality: 'neural',
        characteristics: ['clear', 'authoritative', 'expressive'],
        ssmlSupport: true,
      },
    ],
  },
];

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(defaultSpeechSettings);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [languageConfigs, setLanguageConfigs] = useState<LanguageConfig[]>(LANGUAGE_CONFIGS);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isLanguageDetecting, setIsLanguageDetecting] = useState(false);
  
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const nativeRecording = useRef<Audio.Recording | null>(null);
  const nativeSound = useRef<Audio.Sound | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    loadVoices();
    requestAudioPermission();

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      stopRecording();
    };
  }, []);

  const loadVoices = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Load voices from expo-speech
        const voices = await Speech.getAvailableVoicesAsync();
        const formattedVoices = voices.map(voice => ({
          identifier: voice.identifier,
          name: voice.name,
          quality: voice.quality || 'standard',
          language: voice.language,
        }));
        setAvailableVoices(formattedVoices);
        
        // Load voice profiles from our configurations
        const allProfiles = LANGUAGE_CONFIGS.flatMap(config => config.voices);
        setVoiceProfiles(allProfiles);
      } else {
        // Web fallback - use our voice profiles
        const allProfiles = LANGUAGE_CONFIGS.flatMap(config => config.voices);
        setVoiceProfiles(allProfiles);
        
        // Convert to legacy format for compatibility
        const legacyVoices = allProfiles.map(profile => ({
          identifier: profile.id,
          name: profile.name,
          quality: profile.quality,
          language: profile.language,
        }));
        setAvailableVoices(legacyVoices);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      // Fallback to our predefined voices
      const allProfiles = LANGUAGE_CONFIGS.flatMap(config => config.voices);
      setVoiceProfiles(allProfiles);
    }
  };

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setAudioPermission(true);
        return true;
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        setAudioPermission(false);
        return false;
      }
    } else {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          setAudioPermission(false);
          return false;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        setAudioPermission(true);
        return true;
      } catch (error) {
        console.error('Error requesting audio permission (native):', error);
        setAudioPermission(false);
        return false;
      }
    }
  };

  // Text-to-Speech Functions
  const speak = async (text: string, options?: {
    language?: string;
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    tone?: 'neutral' | 'friendly' | 'professional' | 'casual' | 'dramatic';
    emphasis?: 'normal' | 'strong' | 'subtle';
    pauseDuration?: number;
    useSSML?: boolean;
  }) => {
    if (!text) return;

    try {
      setIsSpeaking(true);
      
      const effectiveLanguage = options?.language || speechSettings.language;
      const effectiveVoice = options?.voice || speechSettings.voice;
      const effectiveRate = options?.rate ?? speechSettings.rate;
      const effectivePitch = options?.pitch ?? speechSettings.pitch;
      const effectiveVolume = options?.volume ?? speechSettings.volume ?? 1.0;
      const effectiveTone = options?.tone ?? speechSettings.tone ?? 'neutral';
      const effectiveEmphasis = options?.emphasis ?? speechSettings.emphasis ?? 'normal';
      const effectivePauseDuration = options?.pauseDuration ?? speechSettings.pauseDuration ?? 0.5;
      const useSSML = options?.useSSML ?? false;

      // Generate SSML if supported and requested
      let processedText = text;
      if (useSSML && effectiveVoice) {
        processedText = generateSSML(text, {
          voice: effectiveVoice,
          rate: effectiveRate,
          pitch: effectivePitch,
          volume: effectiveVolume,
          tone: effectiveTone,
          emphasis: effectiveEmphasis,
          pauseDuration: effectivePauseDuration,
        });
      }

      if (Platform.OS !== 'web') {
        // Use expo-speech for native platforms
        await Speech.speak(processedText, {
          language: effectiveLanguage,
          voice: effectiveVoice,
          rate: effectiveRate,
          pitch: effectivePitch,
          volume: effectiveVolume,
          onStart: () => setIsSpeaking(true),
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: (error) => {
            console.error('Speech error:', error);
            setIsSpeaking(false);
          },
        });
      } else {
        // Web fallback - use Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(processedText);
          utterance.lang = effectiveLanguage;
          utterance.rate = effectiveRate;
          utterance.pitch = effectivePitch;
          utterance.volume = effectiveVolume;
          
          // Try to find matching voice
          if (effectiveVoice) {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => 
              voice.name.includes(effectiveVoice) || 
              voice.lang === effectiveLanguage
            );
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          }
          
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            setIsSpeaking(false);
          };
          
          speechSynthesis.speak(utterance);
        } else {
          console.log(`Speaking: "${processedText}" in ${effectiveLanguage}`);
          // Simulate speaking duration
          const timeoutId = setTimeout(() => {
            setIsSpeaking(false);
          }, Math.max(2000, text.length * 50));
          return () => clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  // SSML Generation for enhanced speech
  const generateSSML = (text: string, options: {
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
    tone: string;
    emphasis: string;
    pauseDuration: number;
  }): string => {
    const { voice, rate, pitch, volume, tone, emphasis, pauseDuration } = options;
    
    // Constants for tone adjustments
    // DRAMATIC_TONE_RATE_MULTIPLIER: Slows down the speech rate for dramatic effect
    const DRAMATIC_TONE_RATE_MULTIPLIER = 0.8;
    // DRAMATIC_TONE_PITCH_INCREASE: Raises the pitch slightly for dramatic effect
    const DRAMATIC_TONE_PITCH_INCREASE = 0.2;

    // Apply tone-based modifications
    let processedText = text;
    if (tone === 'dramatic') {
      processedText = `<prosody rate="${rate * DRAMATIC_TONE_RATE_MULTIPLIER}" pitch="${pitch + DRAMATIC_TONE_PITCH_INCREASE}">${text}</prosody>`;
    } else if (tone === 'casual') {
      processedText = `<prosody rate="${rate * 1.1}" pitch="${pitch - 0.1}">${text}</prosody>`;
    } else if (tone === 'professional') {
      processedText = `<prosody rate="${rate * 0.9}" pitch="${pitch}">${text}</prosody>`;
    } else if (tone === 'friendly') {
      processedText = `<prosody rate="${rate}" pitch="${pitch + 0.1}">${text}</prosody>`;
    }
    
    // Apply emphasis
    if (emphasis === 'strong') {
      processedText = `<emphasis level="strong">${processedText}</emphasis>`;
    } else if (emphasis === 'subtle') {
      processedText = `<emphasis level="reduced">${processedText}</emphasis>`;
    }
    
    // Add pauses for better speech flow
    processedText = processedText.replace(/[.!?]/g, `$&<break time="${pauseDuration}s"/>`);
    processedText = processedText.replace(/,/g, `,<break time="${pauseDuration * 0.5}s"/>`);
    
    // Wrap in SSML with voice and prosody
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voice}">
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
          ${processedText}
        </prosody>
      </voice>
    </speak>`;
  };

  // Language Detection
  const detectLanguage = async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;
    
    setIsLanguageDetecting(true);
    
    try {
      // Simple language detection based on character patterns
      const patterns = {
        'zh-CN': /[\u4e00-\u9fff]/,
        'ja-JP': /[\u3040-\u309f\u30a0-\u30ff]/,
        'ko-KR': /[\uac00-\ud7af]/,
        'ar-SA': /[\u0600-\u06ff]/,
        'hi-IN': /[\u0900-\u097f]/,
        'ru-RU': /[\u0400-\u04ff]/,
        'es-ES': /[ñáéíóúü]/i,
        'fr-FR': /[àâäéèêëïîôöùûüÿç]/i,
        'de-DE': /[äöüß]/i,
        'it-IT': /[àèéìíîòóù]/i,
        'pt-BR': /[ãõçáéíóúâêô]/i,
      };
      
      for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
          setDetectedLanguage(lang);
          return lang;
        }
      }
      
      // Default to English if no pattern matches
      setDetectedLanguage('en-US');
      return 'en-US';
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    } finally {
      setIsLanguageDetecting(false);
    }
  };

  const stopSpeaking = async () => {
    if (Platform.OS !== 'web') {
      await Speech.stop();
    } else if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const pauseSpeaking = async () => {
    if (Platform.OS !== 'web') {
      console.log('Pausing speech');
    }
  };

  const resumeSpeaking = async () => {
    if (Platform.OS !== 'web') {
      console.log('Resuming speech');
    }
  };

  const updateSpeechSettings = (settings: Partial<SpeechSettings>) => {
    setSpeechSettings(prev => ({ ...prev, ...settings }));
  };

  // Speech-to-Text Functions
  const startRecording = async () => {
    if (!audioPermission) {
      const granted = await requestAudioPermission();
      if (!granted) {
        console.error('Audio permission not granted');
        return;
      }
    }

    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.current.start();
        
        setRecordingState({
          isRecording: true,
          isPaused: false,
          duration: 0,
        });

        recordingTimer.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: prev.duration + 1,
          }));
        }, 1000) as ReturnType<typeof setInterval>;
      } else {
        if (nativeRecording.current) {
          try { await nativeRecording.current.stopAndUnloadAsync(); } catch {}
          nativeRecording.current = null;
        }
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        nativeRecording.current = rec;
        setRecordingState({ isRecording: true, isPaused: false, duration: 0 });
        recordingTimer.current = setInterval(() => {
          setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000) as ReturnType<typeof setInterval>;
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async (): Promise<string | undefined> => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      if (Platform.OS === 'web') {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
          return new Promise((resolve) => {
            mediaRecorder.current!.onstop = async () => {
              const type = mediaRecorder.current?.mimeType || 'audio/webm';
              const audioBlob = new Blob(audioChunks.current, { type });
              const url = URL.createObjectURL(audioBlob);
              setRecordingState({ isRecording: false, isPaused: false, duration: 0, uri: url });
              const stream = mediaRecorder.current!.stream;
              stream.getTracks().forEach(track => track.stop());
              resolve(url);
            };
            mediaRecorder.current!.stop();
          });
        }
        // Already stopped or never started
        return recordingState.uri ?? undefined;
      } else {
        if (!nativeRecording.current) return recordingState.uri ?? undefined;
        try {
          await nativeRecording.current.stopAndUnloadAsync();
        } catch (e) {
          console.error('stopAndUnloadAsync error', e);
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = nativeRecording.current.getURI() ?? undefined;
        nativeRecording.current = null;
        setRecordingState({ isRecording: false, isPaused: false, duration: 0, uri: uri ?? undefined });
        return uri ?? undefined;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return undefined;
    }
  };

  const pauseRecording = async () => {
    if (Platform.OS !== 'web') {
      console.log('Pausing recording');
      setRecordingState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resumeRecording = async () => {
    if (Platform.OS !== 'web') {
      console.log('Resuming recording');
      setRecordingState(prev => ({ ...prev, isPaused: false }));
    }
  };

  const getBaseApi = (): string => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      let basePath = '';
      try {
        const match = window.location.pathname.match(/^\/p\/[^/]+/);
        if (match && match[0]) basePath = match[0];
      } catch {}
      return `${origin}${basePath}`.replace(/\/$/, '');
    }
    const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri && typeof hostUri === 'string') {
      let cleaned = hostUri.trim();
      cleaned = cleaned.replace(/^exp:\/\//i, '').replace(/^ws:\/\//i, '').replace(/^wss:\/\//i, '');
      if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
      return cleaned.replace(/\/$/, '');
    }
    return 'http://localhost:8081';
  };

  const transcribeAudio = async (audioUri?: string, options?: {
    language?: string;
    autoDetectLanguage?: boolean;
    punctuation?: boolean;
    formatting?: 'none' | 'basic' | 'enhanced';
    alternatives?: boolean;
  }): Promise<TranscriptionResult | null> => {
    let effectiveUri = audioUri || recordingState.uri;

    if (!effectiveUri) {
      if (recordingState.isRecording) {
        try {
          effectiveUri = await stopRecording();
        } catch (e) {
          console.error('Failed to auto-stop recording before transcription', e);
        }
      } else if (Platform.OS === 'web' && mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        try {
          effectiveUri = await stopRecording();
        } catch (e) {
          console.error('Failed to stop active MediaRecorder before transcription', e);
        }
      }
    }

    if (!effectiveUri) {
      console.error('No audio URI available for transcription');
      return null;
    }

    setIsTranscribing(true);
    setTranscriptionResult(null);

    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(effectiveUri);
        const blob = await response.blob();
        const type = (blob.type && blob.type !== '') ? blob.type : 'audio/webm';
        const extension = type.includes('wav') ? 'wav' : type.includes('mp4') || type.includes('m4a') ? 'm4a' : 'webm';
        const file = new File([blob], `recording.${extension}`, { type });
        formData.append('audio', file);
      } else {
        const uriParts = effectiveUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const audioFile: any = {
          uri: effectiveUri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        };
        formData.append('audio', audioFile);
      }

      // Add language parameter
      const language = options?.language || speechSettings.language;
      if (language && typeof language === 'string') {
        const sanitized = language.trim().slice(0, 10);
        if (sanitized) {
          formData.append('language', sanitized);
        }
      }

      // Add enhanced options
      if (options?.punctuation !== undefined) {
        formData.append('punctuation', options.punctuation.toString());
      }
      if (options?.formatting) {
        formData.append('formatting', options.formatting);
      }
      if (options?.alternatives !== undefined) {
        formData.append('alternatives', options.alternatives.toString());
      }
      if (options?.autoDetectLanguage !== undefined) {
        formData.append('autoDetectLanguage', options.autoDetectLanguage.toString());
      }

      const apiBase = getBaseApi();
      const endpoint = `${apiBase}/api/stt/transcribe`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const respText = await response.text();
        let message = response.statusText || 'Request failed';
        try {
          const errJson = JSON.parse(respText) as { message?: string };
          if (typeof errJson.message === 'string') message = errJson.message;
        } catch {}
        throw new Error(`Transcription failed (${response.status}): ${message}`);
      }

      const ct = response.headers.get('content-type') ?? '';
      const respText = await response.text();
      if (!ct.includes('application/json')) {
        throw new Error('Invalid response type from STT service');
      }
      const result = JSON.parse(respText) as any;
      
      // Auto-detect language if enabled and not provided
      let detectedLanguage = result.language;
      if (options?.autoDetectLanguage && result.text) {
        const detected = await detectLanguage(result.text);
        if (detected) {
          detectedLanguage = detected;
        }
      }

      // Apply formatting if requested
      let formattedText = result.text;
      if (options?.formatting === 'basic' || options?.formatting === 'enhanced') {
        formattedText = formatTranscriptionText(result.text, options.formatting);
      }

      const transcriptionResult: TranscriptionResult = {
        text: formattedText,
        language: detectedLanguage || result.language,
        confidence: result.confidence,
        detectedLanguage: detectedLanguage,
        alternatives: result.alternatives || [],
        punctuation: options?.punctuation ?? true,
        formatting: options?.formatting || 'basic',
        timestamps: result.timestamps || [],
      };

      setTranscriptionResult(transcriptionResult);
      return transcriptionResult;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  // Format transcription text with proper punctuation and capitalization
  const formatTranscriptionText = (text: string, level: 'basic' | 'enhanced'): string => {
    if (!text) return text;

    let formatted = text.trim();

    if (level === 'basic') {
      // Basic formatting: capitalize first letter, add period if missing
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      if (!/[.!?]$/.test(formatted)) {
        formatted += '.';
      }
    } else if (level === 'enhanced') {
      // Enhanced formatting: proper sentence structure, punctuation
      formatted = formatted
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Space after sentence endings
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Space before capital letters
        .replace(/\s*,\s*/g, ', ') // Normalize commas
        .replace(/\s*\.\s*/g, '. ') // Normalize periods
        .replace(/\s*\?\s*/g, '? ') // Normalize question marks
        .replace(/\s*!\s*/g, '! ') // Normalize exclamation marks
        .trim();

      // Capitalize first letter of each sentence
      // The following regex matches the first letter of each sentence (either at the start of the string or after a sentence-ending punctuation and whitespace) for capitalization.
      formatted = formatted.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => 
        prefix + letter.toUpperCase()
      );

      // Ensure it ends with punctuation
      if (!/[.!?]$/.test(formatted)) {
        formatted += '.';
      }
    }

    return formatted;
  };

  const playRecording = async () => {
    if (!recordingState.uri) return;

    try {
      if (Platform.OS === 'web') {
        const audioEl = new (window as any).Audio(recordingState.uri);
        audioEl.preload = 'auto';
        await audioEl.play();
      } else {
        if (nativeSound.current) {
          try { await nativeSound.current.unloadAsync(); } catch {}
          nativeSound.current = null;
        }
        const { sound } = await Audio.Sound.createAsync({ uri: recordingState.uri });
        nativeSound.current = sound;
        const status = (await sound.playAsync()) as AVPlaybackStatusSuccess;
        if (!status.isLoaded) {
          console.log('Sound not loaded');
        }
      }
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };

  const deleteRecording = () => {
    if (recordingState.uri && Platform.OS === 'web') {
      URL.revokeObjectURL(recordingState.uri);
    }
    if (nativeSound.current) {
      try { nativeSound.current.unloadAsync(); } catch {}
      nativeSound.current = null;
    }
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: undefined,
    });
    
    setTranscriptionResult(null);
  };

  const getVoicesForLanguage = (languageCode: string): Voice[] => {
    return availableVoices.filter(voice => 
      voice.language.startsWith(languageCode)
    );
  };

  const getVoiceProfilesForLanguage = (languageCode: string): VoiceProfile[] => {
    return voiceProfiles.filter(profile => 
      profile.language.startsWith(languageCode)
    );
  };

  const getLanguageConfig = (languageCode: string): LanguageConfig | undefined => {
    return languageConfigs.find(config => config.code === languageCode);
  };

  const getSupportedLanguages = (): LanguageConfig[] => {
    return languageConfigs.filter(config => 
      config.sttSupported || config.ttsSupported
    );
  };

  const createVoiceProfile = (profile: Omit<VoiceProfile, 'id'>): VoiceProfile => {
    const newProfile: VoiceProfile = {
      ...profile,
      id: `${profile.language}-${profile.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    };
    setVoiceProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const updateVoiceProfile = (id: string, updates: Partial<VoiceProfile>): void => {
    setVoiceProfiles(prev => 
      prev.map(profile => 
        profile.id === id ? { ...profile, ...updates } : profile
      )
    );
  };

  const deleteVoiceProfile = (id: string): void => {
    setVoiceProfiles(prev => prev.filter(profile => profile.id !== id));
  };

  const speakWithProfile = async (text: string, profileId: string): Promise<void> => {
    const profile = voiceProfiles.find(p => p.id === profileId);
    if (!profile) {
      console.error('Voice profile not found:', profileId);
      return;
    }

    await speak(text, {
      language: profile.language,
      voice: profile.id,
      tone: profile.characteristics.includes('professional') ? 'professional' : 
            profile.characteristics.includes('friendly') ? 'friendly' : 'neutral',
      useSSML: profile.ssmlSupport,
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const speakPhrase = async (phrase: string, language?: string): Promise<void> => {
    const phrases = {
      'en-US': {
        greeting: 'Hello, how are you today?',
        goodbye: 'Goodbye, have a great day!',
        thank_you: 'Thank you very much!',
        please: 'Please, could you help me?',
        sorry: 'I apologize for the inconvenience.',
        yes: 'Yes, that sounds good.',
        no: 'No, thank you.',
        help: 'Could you please help me?',
        repeat: 'Could you repeat that, please?',
        slow_down: 'Could you speak more slowly, please?',
      },
      'es-ES': {
        greeting: 'Hola, ¿cómo estás hoy?',
        goodbye: 'Adiós, ¡que tengas un buen día!',
        thank_you: '¡Muchas gracias!',
        please: 'Por favor, ¿podrías ayudarme?',
        sorry: 'Disculpa las molestias.',
        yes: 'Sí, eso suena bien.',
        no: 'No, gracias.',
        help: '¿Podrías ayudarme, por favor?',
        repeat: '¿Podrías repetir eso, por favor?',
        slow_down: '¿Podrías hablar más despacio, por favor?',
      },
      'fr-FR': {
        greeting: 'Bonjour, comment allez-vous aujourd\'hui?',
        goodbye: 'Au revoir, passez une bonne journée!',
        thank_you: 'Merci beaucoup!',
        please: 'S\'il vous plaît, pourriez-vous m\'aider?',
        sorry: 'Je m\'excuse pour la gêne occasionnée.',
        yes: 'Oui, ça semble bien.',
        no: 'Non, merci.',
        help: 'Pourriez-vous m\'aider, s\'il vous plaît?',
        repeat: 'Pourriez-vous répéter cela, s\'il vous plaît?',
        slow_down: 'Pourriez-vous parler plus lentement, s\'il vous plaît?',
      },
    };

    const lang = language || speechSettings.language;
    const langPhrases = phrases[lang as keyof typeof phrases] || phrases['en-US'];
    const phraseText = langPhrases[phrase as keyof typeof langPhrases] || phrase;
    
    await speak(phraseText, { language: lang });
  };

  return {
    // Text-to-Speech
    isSpeaking,
    speechSettings,
    availableVoices,
    voiceProfiles,
    languageConfigs,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    updateSpeechSettings,
    getVoicesForLanguage,
    getVoiceProfilesForLanguage,
    getLanguageConfig,
    getSupportedLanguages,
    createVoiceProfile,
    updateVoiceProfile,
    deleteVoiceProfile,
    speakWithProfile,
    speakPhrase,
    
    // Speech-to-Text
    recordingState,
    isTranscribing,
    transcriptionResult,
    audioPermission,
    detectedLanguage,
    isLanguageDetecting,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    transcribeAudio,
    playRecording,
    deleteRecording,
    detectLanguage,
    formatTranscriptionText,
    
    // Utility
    formatDuration,
  };
};