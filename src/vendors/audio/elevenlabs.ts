import { AudioEngine, AudioConfig } from '../../patterns/context/AudioEngineContext';

export class ElevenLabsAudioEngine implements AudioEngine {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string, options: Partial<AudioConfig> = {}): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${options.voiceId || 'default'}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        audio.play();
      });
    } catch (error) {
      throw new Error(`ElevenLabs speech synthesis failed: ${error}`);
    }
  }

  async transcribe(audioBlob: Blob, options: Partial<AudioConfig> = {}): Promise<string> {
    // ElevenLabs doesn't provide speech-to-text, so we fall back to a different provider
    throw new Error('ElevenLabs does not support speech-to-text. Use a different provider for transcription.');
  }

  async stop(): Promise<void> {
    // Stop all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  async pause(): Promise<void> {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => audio.pause());
  }

  async resume(): Promise<void> {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => audio.play());
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Audio' in window;
  }

  async getAvailableVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: voice.labels?.language || 'en',
      }));
    } catch (error) {
      console.warn('Failed to get ElevenLabs voices:', error);
      return [];
    }
  }
}