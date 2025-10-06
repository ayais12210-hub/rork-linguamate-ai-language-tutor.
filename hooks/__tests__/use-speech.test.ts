import { renderHook, act } from '@testing-library/react-native';
import { useSpeech } from '../use-speech';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
}));

// Mock expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock Audio
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

describe('useSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Language Detection', () => {
    it('should detect Chinese text correctly', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('你好世界');
        expect(detected).toBe('zh-CN');
      });
    });

    it('should detect Japanese text correctly', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('こんにちは世界');
        expect(detected).toBe('ja-JP');
      });
    });

    it('should detect Korean text correctly', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('안녕하세요 세계');
        expect(detected).toBe('ko-KR');
      });
    });

    it('should detect Arabic text correctly', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('مرحبا بالعالم');
        expect(detected).toBe('ar-SA');
      });
    });

    it('should detect Spanish text correctly', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('Hola mundo');
        expect(detected).toBe('en-US'); // Default fallback
      });
    });

    it('should return null for empty text', async () => {
      const { result } = renderHook(() => useSpeech());
      
      await act(async () => {
        const detected = await result.current.detectLanguage('');
        expect(detected).toBeNull();
      });
    });
  });

  describe('Voice Profiles', () => {
    it('should create a new voice profile', () => {
      const { result } = renderHook(() => useSpeech());
      
      act(() => {
        const profile = result.current.createVoiceProfile({
          name: 'Test Voice',
          language: 'en-US',
          accent: 'us',
          gender: 'female',
          age: 'adult',
          quality: 'neural',
          characteristics: ['clear', 'friendly'],
          ssmlSupport: true,
        });
        
        expect(profile.id).toBeDefined();
        expect(profile.name).toBe('Test Voice');
        expect(profile.language).toBe('en-US');
      });
    });

    it('should update an existing voice profile', () => {
      const { result } = renderHook(() => useSpeech());
      
      // First create a profile
      let profileId: string;
      act(() => {
        const profile = result.current.createVoiceProfile({
          name: 'Test Voice',
          language: 'en-US',
          accent: 'us',
          gender: 'female',
          age: 'adult',
          quality: 'neural',
          characteristics: ['clear', 'friendly'],
          ssmlSupport: true,
        });
        profileId = profile.id;
      });

      // Then update it
      act(() => {
        result.current.updateVoiceProfile(profileId, {
          name: 'Updated Voice',
          characteristics: ['clear', 'professional'],
        });
      });

      const profiles = result.current.voiceProfiles;
      const updatedProfile = profiles.find(p => p.id === profileId);
      expect(updatedProfile?.name).toBe('Updated Voice');
      expect(updatedProfile?.characteristics).toEqual(['clear', 'professional']);
    });

    it('should delete a voice profile', () => {
      const { result } = renderHook(() => useSpeech());
      
      // Create a profile
      let profileId: string;
      act(() => {
        const profile = result.current.createVoiceProfile({
          name: 'Test Voice',
          language: 'en-US',
          accent: 'us',
          gender: 'female',
          age: 'adult',
          quality: 'neural',
          characteristics: ['clear', 'friendly'],
          ssmlSupport: true,
        });
        profileId = profile.id;
      });

      const initialCount = result.current.voiceProfiles.length;

      // Delete it
      act(() => {
        result.current.deleteVoiceProfile(profileId);
      });

      expect(result.current.voiceProfiles.length).toBe(initialCount - 1);
    });

    it('should get voice profiles for a specific language', () => {
      const { result } = renderHook(() => useSpeech());
      
      act(() => {
        result.current.createVoiceProfile({
          name: 'English Voice',
          language: 'en-US',
          accent: 'us',
          gender: 'female',
          age: 'adult',
          quality: 'neural',
          characteristics: ['clear'],
          ssmlSupport: true,
        });
        
        result.current.createVoiceProfile({
          name: 'Spanish Voice',
          language: 'es-ES',
          accent: 'spain',
          gender: 'male',
          age: 'adult',
          quality: 'neural',
          characteristics: ['warm'],
          ssmlSupport: true,
        });
      });

      const englishVoices = result.current.getVoiceProfilesForLanguage('en-US');
      const spanishVoices = result.current.getVoiceProfilesForLanguage('es-ES');

      expect(englishVoices.length).toBeGreaterThan(0);
      expect(spanishVoices.length).toBeGreaterThan(0);
      expect(englishVoices.every(v => v.language.startsWith('en-US'))).toBe(true);
      expect(spanishVoices.every(v => v.language.startsWith('es-ES'))).toBe(true);
    });
  });

  describe('Language Configuration', () => {
    it('should get language configuration for a specific language', () => {
      const { result } = renderHook(() => useSpeech());
      
      const config = result.current.getLanguageConfig('en-US');
      expect(config).toBeDefined();
      expect(config?.code).toBe('en-US');
      expect(config?.name).toBe('English (US)');
      expect(config?.flag).toBe('🇺🇸');
    });

    it('should return undefined for unsupported language', () => {
      const { result } = renderHook(() => useSpeech());
      
      const config = result.current.getLanguageConfig('xx-XX');
      expect(config).toBeUndefined();
    });

    it('should get supported languages', () => {
      const { result } = renderHook(() => useSpeech());
      
      const supported = result.current.getSupportedLanguages();
      expect(supported.length).toBeGreaterThan(0);
      expect(supported.every(lang => lang.sttSupported || lang.ttsSupported)).toBe(true);
    });
  });

  describe('Text Formatting', () => {
    it('should format text with basic formatting', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText('hello world', 'basic');
      expect(formatted).toBe('Hello world.');
    });

    it('should format text with enhanced formatting', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText(
        'hello world  how are you today',
        'enhanced'
      );
      expect(formatted).toBe('Hello world. How are you today.');
    });

    it('should handle empty text', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText('', 'basic');
      expect(formatted).toBe('');
    });

    it('should add period to text without punctuation', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText('hello world', 'enhanced');
      expect(formatted).toBe('Hello world.');
    });

    it('should not add period to text that already has punctuation', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText('hello world!', 'enhanced');
      expect(formatted).toBe('Hello world!');
    });

    it('should handle text with only whitespace', () => {
      const { result } = renderHook(() => useSpeech());
      
      const formatted = result.current.formatTranscriptionText('   ', 'enhanced');
      expect(formatted).toBe('.');
    });
  });

  describe('Speech Settings', () => {
    it('should update speech settings', () => {
      const { result } = renderHook(() => useSpeech());
      
      act(() => {
        result.current.updateSpeechSettings({
          rate: 1.5,
          pitch: 1.2,
          tone: 'friendly',
          emphasis: 'strong',
        });
      });

      expect(result.current.speechSettings.rate).toBe(1.5);
      expect(result.current.speechSettings.pitch).toBe(1.2);
      expect(result.current.speechSettings.tone).toBe('friendly');
      expect(result.current.speechSettings.emphasis).toBe('strong');
    });

    it('should maintain existing settings when updating', () => {
      const { result } = renderHook(() => useSpeech());
      
      act(() => {
        result.current.updateSpeechSettings({
          rate: 1.5,
        });
      });

      expect(result.current.speechSettings.rate).toBe(1.5);
      expect(result.current.speechSettings.pitch).toBe(1.0); // Default value
      expect(result.current.speechSettings.language).toBe('en-US'); // Default value
    });
  });

  describe('Phrase Support', () => {
    it('should speak a greeting phrase', async () => {
      const { result } = renderHook(() => useSpeech());
      
      const mockSpeak = jest.fn();
      (Speech.speak as jest.Mock).mockImplementation(mockSpeak);

      await act(async () => {
        await result.current.speakPhrase('greeting', 'en-US');
      });

      expect(mockSpeak).toHaveBeenCalledWith(
        'Hello, how are you today?',
        expect.objectContaining({
          language: 'en-US',
        })
      );
    });

    it('should speak a Spanish phrase', async () => {
      const { result } = renderHook(() => useSpeech());
      
      const mockSpeak = jest.fn();
      (Speech.speak as jest.Mock).mockImplementation(mockSpeak);

      await act(async () => {
        await result.current.speakPhrase('greeting', 'es-ES');
      });

      expect(mockSpeak).toHaveBeenCalledWith(
        'Hola, ¿cómo estás hoy?',
        expect.objectContaining({
          language: 'es-ES',
        })
      );
    });

    it('should fallback to English for unsupported language', async () => {
      const { result } = renderHook(() => useSpeech());
      
      const mockSpeak = jest.fn();
      (Speech.speak as jest.Mock).mockImplementation(mockSpeak);

      await act(async () => {
        await result.current.speakPhrase('greeting', 'xx-XX');
      });

      expect(mockSpeak).toHaveBeenCalledWith(
        'Hello, how are you today?',
        expect.objectContaining({
          language: 'xx-XX',
        })
      );
    });
  });

  describe('Enhanced Transcription', () => {
    it('should transcribe with enhanced options', async () => {
      const { result } = renderHook(() => useSpeech());
      
      // Mock fetch for the transcription request
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          text: 'hello world',
          language: 'en-US',
          confidence: 0.95,
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      await act(async () => {
        const transcription = await result.current.transcribeAudio(undefined, {
          language: 'en-US',
          autoDetectLanguage: true,
          punctuation: true,
          formatting: 'enhanced',
          alternatives: true,
        });
        
        expect(transcription).toBeDefined();
        expect(transcription?.text).toBe('Hello world.');
        expect(transcription?.language).toBe('en-US');
        expect(transcription?.formatting).toBe('enhanced');
      });
    });
  });
});
