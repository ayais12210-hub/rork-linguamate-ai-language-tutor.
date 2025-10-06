# Speech Features Quick Start Guide

## Getting Started

The enhanced speech system provides powerful TTS and STT capabilities. Here's how to get started quickly.

## Basic Usage

### 1. Import the Hook

```typescript
import { useSpeech } from '@/hooks/use-speech';
```

### 2. Basic Speech Synthesis

```typescript
function MyComponent() {
  const { speak, isSpeaking } = useSpeech();

  return (
    <TouchableOpacity onPress={() => speak('Hello world!')}>
      <Text>{isSpeaking ? 'Speaking...' : 'Speak'}</Text>
    </TouchableOpacity>
  );
}
```

### 3. Basic Speech Recognition

```typescript
function TranscriptionComponent() {
  const { 
    startRecording, 
    stopRecording, 
    transcribeAudio,
    isTranscribing 
  } = useSpeech();

  const handleRecord = async () => {
    await startRecording();
    // ... after some time
    const audioUri = await stopRecording();
    const result = await transcribeAudio(audioUri);
    console.log('Transcribed:', result?.text);
  };

  return (
    <TouchableOpacity onPress={handleRecord}>
      <Text>{isTranscribing ? 'Transcribing...' : 'Record'}</Text>
    </TouchableOpacity>
  );
}
```

## Advanced Features

### Voice Customization

```typescript
const { speak, updateSpeechSettings } = useSpeech();

// Customize voice
updateSpeechSettings({
  rate: 1.2,        // 20% faster
  pitch: 1.1,       // Higher pitch
  tone: 'friendly', // Friendly tone
  volume: 0.9,      // 90% volume
});

await speak('This is a customized voice!');
```

### Language Detection

```typescript
const { detectLanguage, speak } = useSpeech();

const handleText = async (text: string) => {
  const language = await detectLanguage(text);
  await speak(text, { language });
};
```

### Quick Phrases

```typescript
const { speakPhrase } = useSpeech();

// Speak common phrases
await speakPhrase('greeting', 'en-US');    // "Hello, how are you today?"
await speakPhrase('thank_you', 'es-ES');  // "¡Muchas gracias!"
await speakPhrase('help', 'fr-FR');       // "Pourriez-vous m'aider, s'il vous plaît?"
```

### Voice Profiles

```typescript
const { 
  createVoiceProfile, 
  speakWithProfile, 
  voiceProfiles 
} = useSpeech();

// Create a custom voice
const profile = createVoiceProfile({
  name: 'My Assistant',
  language: 'en-US',
  accent: 'us',
  gender: 'female',
  age: 'adult',
  quality: 'neural',
  characteristics: ['clear', 'professional'],
  ssmlSupport: true,
});

// Use the custom voice
await speakWithProfile('Hello from my custom voice!', profile.id);
```

## Speech Settings UI

The enhanced speech settings screen provides a comprehensive interface for all features:

- **Test Speech**: Try different voices and settings
- **Language Selection**: Choose from 15+ supported languages
- **Voice Parameters**: Adjust rate, pitch, volume, tone, and emphasis
- **Quick Phrases**: Test common phrases in different languages
- **Voice Profiles**: Create and manage custom voice configurations

## Common Use Cases

### 1. Language Learning App

```typescript
function LanguageLearning() {
  const { speak, speakPhrase, detectLanguage } = useSpeech();

  const practicePhrase = async (phrase: string, targetLang: string) => {
    // Speak the phrase in target language
    await speakPhrase(phrase, targetLang);
  };

  const checkPronunciation = async (userText: string) => {
    const detected = await detectLanguage(userText);
    return detected === targetLanguage;
  };
}
```

### 2. Accessibility Features

```typescript
function AccessibilityFeatures() {
  const { speak, updateSpeechSettings } = useSpeech();

  const announceContent = (content: string) => {
    updateSpeechSettings({
      rate: 0.8,  // Slower for accessibility
      tone: 'clear',
      emphasis: 'strong',
    });
    speak(content);
  };
}
```

### 3. Voice Assistant

```typescript
function VoiceAssistant() {
  const { 
    speak, 
    transcribeAudio, 
    createVoiceProfile,
    speakWithProfile 
  } = useSpeech();

  const assistantProfile = createVoiceProfile({
    name: 'Assistant',
    language: 'en-US',
    gender: 'neutral',
    characteristics: ['helpful', 'clear'],
    ssmlSupport: true,
  });

  const handleUserInput = async (audioUri: string) => {
    const transcription = await transcribeAudio(audioUri);
    if (transcription?.text) {
      const response = generateResponse(transcription.text);
      await speakWithProfile(response, assistantProfile.id);
    }
  };
}
```

## Tips and Best Practices

1. **Test Voice Settings**: Use the test section to find the perfect voice configuration
2. **Language Detection**: Works best with longer text samples
3. **Voice Profiles**: Create profiles for different use cases (assistant, narrator, etc.)
4. **Error Handling**: Always handle speech errors gracefully
5. **Performance**: Cache voice profiles and language settings when possible

## Troubleshooting

- **No speech on web**: Check browser permissions and HTTPS
- **Poor transcription**: Ensure good audio quality and correct language
- **Voice issues**: Try different voice profiles or adjust parameters
- **Language detection**: Use longer text or manual language selection

For more detailed information, see the [Complete Documentation](./SPEECH_FEATURES.md).