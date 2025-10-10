import { AudioEngine, AudioConfig } from '../../patterns/context/AudioEngineContext';

export class GoogleAudioEngine implements AudioEngine {
  private apiKey: string;
  private baseUrl = 'https://texttospeech.googleapis.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string, options: Partial<AudioConfig> = {}): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: options.language || 'en-US',
            name: options.voiceId || 'en-US-Wavenet-D',
            ssmlGender: 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: options.rate || 1.0,
            pitch: options.pitch || 1.0,
            volumeGainDb: (options.volume || 1.0) * 16 - 16, // Convert 0-1 to dB
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const audioData = data.audioContent;
      
      // Convert base64 to blob
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      
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
      throw new Error(`Google speech synthesis failed: ${error}`);
    }
  }

  async transcribe(audioBlob: Blob, options: Partial<AudioConfig> = {}): Promise<string> {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'MP3',
            sampleRateHertz: 16000,
            languageCode: options.language || 'en-US',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: base64Audio,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Speech API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results?.[0]?.alternatives?.[0]?.transcript || '';
    } catch (error) {
      throw new Error(`Google transcription failed: ${error}`);
    }
  }

  async stop(): Promise<void> {
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
      const response = await fetch(`${this.baseUrl}/voices?key=${this.apiKey}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        id: voice.name,
        name: voice.name,
        language: voice.languageCodes?.[0] || 'en-US',
      }));
    } catch (error) {
      console.warn('Failed to get Google voices:', error);
      return [];
    }
  }
}