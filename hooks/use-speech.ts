import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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

  const requestAudioPermission = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setAudioPermission(true);
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        setAudioPermission(false);
      }
    } else {
      // Mock permission for development - expo-av not available in Expo Go
      console.log('Audio recording requires a custom development client');
      setAudioPermission(false);
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
      setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
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
      await requestAudioPermission();
      if (!audioPermission) return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web recording using MediaRecorder
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

        // Start duration timer
        recordingTimer.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: prev.duration + 1,
          }));
        }, 1000) as ReturnType<typeof setInterval>;
      } else {
        // Mobile recording not available in Expo Go
        console.log('Audio recording requires a custom development client');
        return;
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      // Stop duration timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      if (Platform.OS === 'web') {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
          return new Promise((resolve) => {
            mediaRecorder.current!.onstop = async () => {
              const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(audioBlob);
              
              setRecordingState({
                isRecording: false,
                isPaused: false,
                duration: 0,
                uri: url,
              });

              // Stop all tracks
              const stream = mediaRecorder.current!.stream;
              stream.getTracks().forEach(track => track.stop());
              
              resolve(url);
            };
            
            mediaRecorder.current!.stop();
          });
        }
      }

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
      });

      return null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
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

  const transcribeAudio = async (audioUri?: string, language?: string): Promise<TranscriptionResult | null> => {
    const uri = audioUri || recordingState.uri;
    if (!uri) {
      console.error('No audio URI available for transcription');
      return null;
    }

    setIsTranscribing(true);
    setTranscriptionResult(null);

    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For web, convert blob URL to file
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        formData.append('audio', file);
      } else {
        // For mobile (when available with custom dev client)
        console.log('Audio transcription requires a custom development client');
        return null;
      }

      if (language) {
        formData.append('language', language);
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
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
        const audio = new Audio(recordingState.uri);
        await audio.play();
      } else {
        console.log('Audio playback requires a custom development client');
      }
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };

  const deleteRecording = () => {
    if (recordingState.uri && Platform.OS === 'web') {
      URL.revokeObjectURL(recordingState.uri);
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