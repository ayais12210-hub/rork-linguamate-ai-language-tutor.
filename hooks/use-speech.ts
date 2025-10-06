import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import Constants from 'expo-constants';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  language: string;
  voice?: string;
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
};

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(defaultSpeechSettings);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const nativeRecording = useRef<Audio.Recording | null>(null);
  const nativeSound = useRef<Audio.Sound | null>(null);

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
    // Mock voices for development - expo-speech not available in Expo Go
    if (Platform.OS !== 'web') {
      setAvailableVoices([
        { identifier: 'en-US-1', name: 'English (US)', quality: 'Default', language: 'en-US' },
        { identifier: 'es-ES-1', name: 'Spanish (Spain)', quality: 'Default', language: 'es-ES' },
        { identifier: 'fr-FR-1', name: 'French (France)', quality: 'Default', language: 'fr-FR' },
      ]);
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
  const speak = async (text: string, language?: string) => {
    if (!text) return;

    try {
      setIsSpeaking(true);
      
      // Mock TTS for development - expo-speech not available in Expo Go
      console.log(`Speaking: "${text}" in ${language || speechSettings.language}`);
      
      // Simulate speaking duration
      const timeoutId = setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
      
      // Store timeout ID for potential cleanup
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
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
        if (__DEV__) {
          console.warn('Audio permission not granted');
        }
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

  const transcribeAudio = async (audioUri?: string, language?: string): Promise<TranscriptionResult | null> => {
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

      if (language && typeof language === 'string') {
        const sanitized = language.trim().slice(0, 10);
        if (sanitized) {
          formData.append('language', sanitized);
        }
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
      
      const transcriptionResult: TranscriptionResult = {
        text: result.text,
        language: result.language,
        confidence: result.confidence,
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // Text-to-Speech
    isSpeaking,
    speechSettings,
    availableVoices,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    updateSpeechSettings,
    getVoicesForLanguage,
    
    // Speech-to-Text
    recordingState,
    isTranscribing,
    transcriptionResult,
    audioPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    transcribeAudio,
    playRecording,
    deleteRecording,
    formatDuration,
  };
};