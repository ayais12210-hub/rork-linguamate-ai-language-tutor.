# Enhanced Speech Features Documentation

## Overview

The enhanced speech system provides comprehensive Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities with advanced features including language detection, voice profiles, SSML support, and multi-language support.

## Features

### 🎯 Language Detection
- **Automatic Language Detection**: Automatically detects the language of input text using character pattern recognition
- **Supported Languages**: Chinese, Japanese, Korean, Arabic, Hindi, Russian, Spanish, French, German, Italian, Portuguese, and more
- **Fallback Support**: Defaults to English when language cannot be detected

### 🌍 Multi-Language Support
- **15+ Languages**: Comprehensive support for major world languages
- **Regional Variants**: Support for different regional accents (e.g., en-US, en-GB, es-ES, es-MX)
- **Native Names**: Display languages in their native script
- **Flag Icons**: Visual language identification with flag emojis

### 🎵 Voice Parameters & Control
- **Speech Rate**: Adjustable from 0.5x to 2.0x speed
- **Pitch Control**: Fine-tune voice pitch from 0.5x to 2.0x
- **Volume Control**: Adjustable volume from 0.1 to 1.0
- **Tone Selection**: Choose from neutral, friendly, professional, casual, or dramatic tones
- **Emphasis Control**: Normal, strong, or subtle emphasis levels
- **Pause Duration**: Customizable pause timing for better speech flow

### 🎭 Voice Profiles
- **Custom Voice Profiles**: Create and manage personalized voice configurations
- **Voice Characteristics**: Define voice personality traits (clear, friendly, professional, etc.)
- **Gender & Age**: Select from male, female, or neutral voices with age ranges
- **Quality Levels**: Standard, premium, or neural voice quality
- **SSML Support**: Advanced voice profiles with SSML markup support

### 📝 Enhanced Transcription
- **Smart Formatting**: Basic and enhanced text formatting with proper punctuation
- **Punctuation Control**: Automatic punctuation insertion and correction
- **Alternative Transcriptions**: Get multiple transcription options for better accuracy
- **Word Timestamps**: Precise timing information for each word
- **Confidence Scores**: Reliability indicators for transcription accuracy

### 🗣️ SSML Support
- **Speech Synthesis Markup Language**: Advanced voice control using SSML
- **Prosody Control**: Fine-tune rate, pitch, and volume within text
- **Emphasis Markup**: Add strong or subtle emphasis to specific words
- **Break Control**: Insert pauses and timing controls
- **Voice Selection**: Choose specific voices within SSML

### 💬 Quick Phrases
- **Pre-built Phrases**: Common phrases in multiple languages
- **Language-Specific**: Greetings, thanks, apologies, and help phrases
- **Easy Integration**: Simple API for speaking common phrases
- **Extensible**: Easy to add new phrases and languages

## API Reference

### useSpeech Hook

The main hook that provides all speech functionality.

```typescript
const {
  // Text-to-Speech
  isSpeaking,
  speechSettings,
  voiceProfiles,
  languageConfigs,
  speak,
  stopSpeaking,
  speakPhrase,
  speakWithProfile,
  
  // Speech-to-Text
  isTranscribing,
  transcriptionResult,
  detectedLanguage,
  transcribeAudio,
  
  // Voice Management
  createVoiceProfile,
  updateVoiceProfile,
  deleteVoiceProfile,
  getVoiceProfilesForLanguage,
  
  // Language Management
  getLanguageConfig,
  getSupportedLanguages,
  detectLanguage,
  
  // Utility
  formatTranscriptionText,
  updateSpeechSettings,
} = useSpeech();
```

### Core Functions

#### Text-to-Speech

```typescript
// Basic speech
await speak('Hello world');

// Advanced speech with options
await speak('Hello world', {
  language: 'en-US',
  voice: 'en-us-1',
  rate: 1.2,
  pitch: 1.1,
  volume: 0.9,
  tone: 'friendly',
  emphasis: 'strong',
  useSSML: true,
});

// Speak with voice profile
await speakWithProfile('Hello world', 'profile-id');

// Speak common phrases
await speakPhrase('greeting', 'en-US');
```

#### Speech-to-Text

```typescript
// Basic transcription
const result = await transcribeAudio(audioUri);

// Enhanced transcription with options
const result = await transcribeAudio(audioUri, {
  language: 'en-US',
  autoDetectLanguage: true,
  punctuation: true,
  formatting: 'enhanced',
  alternatives: true,
});
```

#### Voice Profile Management

```typescript
// Create a new voice profile
const profile = createVoiceProfile({
  name: 'My Custom Voice',
  language: 'en-US',
  accent: 'us',
  gender: 'female',
  age: 'adult',
  quality: 'neural',
  characteristics: ['clear', 'friendly'],
  ssmlSupport: true,
});

// Update an existing profile
updateVoiceProfile(profileId, {
  name: 'Updated Voice',
  characteristics: ['professional'],
});

// Delete a profile
deleteVoiceProfile(profileId);

// Get voices for a language
const voices = getVoiceProfilesForLanguage('en-US');
```

#### Language Detection

```typescript
// Detect language from text
const language = await detectLanguage('你好世界');
console.log(language); // 'zh-CN'

// Get language configuration
const config = getLanguageConfig('en-US');
console.log(config.name); // 'English (US)'

// Get all supported languages
const languages = getSupportedLanguages();
```

### Data Types

#### SpeechSettings
```typescript
interface SpeechSettings {
  rate: number;           // 0.5 - 2.0
  pitch: number;          // 0.5 - 2.0
  language: string;       // BCP47 language code
  voice?: string;         // Voice identifier
  volume?: number;        // 0.1 - 1.0
  accent?: string;        // Regional accent
  tone?: 'neutral' | 'friendly' | 'professional' | 'casual' | 'dramatic';
  emphasis?: 'normal' | 'strong' | 'subtle';
  pauseDuration?: number; // Pause duration in seconds
}
```

#### VoiceProfile
```typescript
interface VoiceProfile {
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
```

#### TranscriptionResult
```typescript
interface TranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
  detectedLanguage?: string;
  alternatives?: string[];
  punctuation?: boolean;
  formatting?: 'none' | 'basic' | 'enhanced';
  timestamps?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}
```

## Usage Examples

### Basic Speech Synthesis

```typescript
import { useSpeech } from '@/hooks/use-speech';

function MyComponent() {
  const { speak, isSpeaking } = useSpeech();

  const handleSpeak = async () => {
    await speak('Hello, welcome to our app!');
  };

  return (
    <TouchableOpacity onPress={handleSpeak}>
      <Text>{isSpeaking ? 'Speaking...' : 'Speak'}</Text>
    </TouchableOpacity>
  );
}
```

### Advanced Voice Control

```typescript
function AdvancedSpeech() {
  const { speak, updateSpeechSettings, speechSettings } = useSpeech();

  const speakWithCustomSettings = async () => {
    // Update settings
    updateSpeechSettings({
      rate: 1.2,
      pitch: 1.1,
      tone: 'friendly',
      emphasis: 'strong',
    });

    // Speak with custom voice
    await speak('This is a friendly, emphasized message!', {
      useSSML: true,
    });
  };

  return (
    <TouchableOpacity onPress={speakWithCustomSettings}>
      <Text>Speak with Custom Voice</Text>
    </TouchableOpacity>
  );
}
```

### Language Detection and Multi-language Support

```typescript
function MultiLanguageComponent() {
  const { detectLanguage, speak, getSupportedLanguages } = useSpeech();
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const handleTextInput = async (text: string) => {
    const language = await detectLanguage(text);
    setDetectedLang(language);
    
    // Speak in detected language
    if (language) {
      await speak(text, { language });
    }
  };

  const supportedLanguages = getSupportedLanguages();

  return (
    <View>
      <TextInput 
        onChangeText={handleTextInput}
        placeholder="Type in any language..."
      />
      {detectedLang && (
        <Text>Detected: {detectedLang}</Text>
      )}
    </View>
  );
}
```

### Voice Profile Management

```typescript
function VoiceProfileManager() {
  const { 
    voiceProfiles, 
    createVoiceProfile, 
    speakWithProfile 
  } = useSpeech();

  const createCustomVoice = () => {
    const profile = createVoiceProfile({
      name: 'My Assistant',
      language: 'en-US',
      accent: 'us',
      gender: 'female',
      age: 'adult',
      quality: 'neural',
      characteristics: ['clear', 'professional', 'warm'],
      ssmlSupport: true,
    });
    
    console.log('Created profile:', profile.id);
  };

  const testVoice = (profileId: string) => {
    speakWithProfile('Hello, this is my custom voice!', profileId);
  };

  return (
    <View>
      <TouchableOpacity onPress={createCustomVoice}>
        <Text>Create Custom Voice</Text>
      </TouchableOpacity>
      
      {voiceProfiles.map(profile => (
        <TouchableOpacity 
          key={profile.id}
          onPress={() => testVoice(profile.id)}
        >
          <Text>{profile.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Enhanced Transcription

```typescript
function TranscriptionComponent() {
  const { 
    transcribeAudio, 
    isTranscribing, 
    transcriptionResult 
  } = useSpeech();

  const handleTranscribe = async (audioUri: string) => {
    const result = await transcribeAudio(audioUri, {
      autoDetectLanguage: true,
      punctuation: true,
      formatting: 'enhanced',
      alternatives: true,
    });

    if (result) {
      console.log('Transcribed:', result.text);
      console.log('Language:', result.language);
      console.log('Confidence:', result.confidence);
      console.log('Alternatives:', result.alternatives);
    }
  };

  return (
    <View>
      {isTranscribing && <Text>Transcribing...</Text>}
      {transcriptionResult && (
        <Text>{transcriptionResult.text}</Text>
      )}
    </View>
  );
}
```

## Configuration

### Language Configuration

The system includes pre-configured language settings for 15+ languages:

```typescript
const LANGUAGE_CONFIGS = [
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    sttSupported: true,
    ttsSupported: true,
    autoDetection: true,
    voices: [/* voice profiles */],
    punctuationRules: {
      sentenceEndings: ['.', '!', '?'],
      questionMarks: ['?'],
      exclamationMarks: ['!'],
    },
  },
  // ... more languages
];
```

### Voice Profiles

Pre-configured voice profiles for each language:

```typescript
const voiceProfiles = [
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
  // ... more voices
];
```

## Best Practices

### Performance Optimization
- Use voice profiles for frequently used voice configurations
- Cache language detection results when possible
- Implement proper cleanup for audio resources

### User Experience
- Provide visual feedback during speech operations
- Allow users to test voice settings before applying
- Support accessibility features for speech-impaired users

### Error Handling
- Always handle speech synthesis errors gracefully
- Provide fallback options for unsupported languages
- Implement retry mechanisms for transcription failures

### Accessibility
- Ensure proper contrast and sizing for voice controls
- Provide alternative input methods for voice features
- Support screen readers and assistive technologies

## Troubleshooting

### Common Issues

1. **Speech not working on web**
   - Ensure browser supports Web Speech API
   - Check microphone permissions
   - Verify HTTPS connection for production

2. **Language detection inaccurate**
   - Use longer text samples for better accuracy
   - Consider manual language selection for short phrases
   - Check for mixed-language content

3. **Voice quality issues**
   - Try different voice profiles
   - Adjust rate and pitch settings
   - Enable SSML for advanced control

4. **Transcription errors**
   - Check audio quality and format
   - Ensure proper language selection
   - Try different formatting options

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Enable debug mode
console.log('Speech settings:', speechSettings);
console.log('Available voices:', voiceProfiles);
console.log('Supported languages:', getSupportedLanguages());
```

## Future Enhancements

- **Real-time Translation**: Live translation during speech
- **Emotion Detection**: Voice emotion analysis and response
- **Custom Voice Training**: User-specific voice model training
- **Offline Support**: Local speech processing capabilities
- **Voice Cloning**: Create custom voices from samples
- **Multi-speaker Support**: Handle multiple speakers in audio
- **Advanced SSML**: More sophisticated voice control options

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.