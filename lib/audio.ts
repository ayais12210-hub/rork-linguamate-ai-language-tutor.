import { Platform } from 'react-native';

// Audio utilities for the language learning app

// Audio configuration types
export interface AudioConfig {
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  format?: string;
}

export interface RecordingOptions {
  maxDuration?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'wav' | 'm4a' | 'mp3';
}

export interface PlaybackOptions {
  volume?: number;
  rate?: number;
  loop?: boolean;
}

// Audio recording state
export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri?: string;
  size?: number;
}

// Audio playback state
export interface PlaybackState {
  isPlaying: boolean;
  duration: number;
  position: number;
  isLoaded: boolean;
}

// Web Audio API utilities
export class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(options: RecordingOptions = {}): Promise<void> {
    if (Platform.OS !== 'web') {
      throw new Error('WebAudioRecorder is only available on web platform');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      
      // Auto-stop after max duration
      if (options.maxDuration) {
        setTimeout(() => {
          this.stopRecording();
        }, options.maxDuration);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Failed to start recording:', error);

      }
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }
}

// Audio format utilities
export const audioFormats = {
  // Get recommended format for platform
  getRecommendedFormat(): string {
    if (Platform.OS === 'ios') {
      return 'wav';
    }
    if (Platform.OS === 'android') {
      return 'm4a';
    }
    return 'webm'; // Web
  },

  // Get MIME type for format
  getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      mp3: 'audio/mpeg',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
    };
    return mimeTypes[format] || 'audio/wav';
  },

  // Get file extension for MIME type
  getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/wav': 'wav',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
    };
    return extensions[mimeType] || 'wav';
  },
};

// Audio quality presets
export const audioQualityPresets = {
  low: {
    sampleRate: 16000,
    channels: 1,
    bitRate: 32000,
  },
  medium: {
    sampleRate: 22050,
    channels: 1,
    bitRate: 64000,
  },
  high: {
    sampleRate: 44100,
    channels: 2,
    bitRate: 128000,
  },
};

// Audio validation utilities
export const audioValidation = {
  // Check if audio format is supported
  isFormatSupported(format: string): boolean {
    const supportedFormats = Platform.select({
      ios: ['wav', 'm4a', 'mp3'],
      android: ['m4a', 'mp3', 'wav'],
      web: ['webm', 'wav', 'mp3', 'ogg'],
      default: ['wav', 'mp3'],
    });
    return supportedFormats.includes(format);
  },

  // Validate audio file size
  isValidFileSize(sizeInBytes: number, maxSizeMB = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return sizeInBytes <= maxSizeBytes;
  },

  // Validate audio duration
  isValidDuration(durationMs: number, maxDurationMs = 300000): boolean {
    return durationMs > 0 && durationMs <= maxDurationMs;
  },
};

// Audio processing utilities
export const audioProcessing = {
  // Convert blob to base64
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Convert base64 to blob
  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },

  // Create audio URL from blob
  createAudioUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  },

  // Revoke audio URL
  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  },

  // Format duration for display
  formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Calculate audio file size estimate
  estimateFileSize(
    durationMs: number,
    sampleRate = 44100,
    channels = 2,
    bitDepth = 16
  ): number {
    const durationSeconds = durationMs / 1000;
    const bytesPerSecond = (sampleRate * channels * bitDepth) / 8;
    return Math.round(durationSeconds * bytesPerSecond);
  },
};

// Audio permissions utilities
export const audioPermissions = {
  // Check if microphone permission is granted (web)
  async checkMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'web' || !navigator.permissions) {
      return true; // Assume granted on mobile (handled by expo-av)
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      if (__DEV__) {

        console.error('Error checking microphone permission:', error);

      }
      return false;
    }
  },

  // Request microphone permission (web)
  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      return true; // Handled by expo-av on mobile
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      if (__DEV__) {

        console.error('Microphone permission denied:', error);

      }
      return false;
    }
  },
};

// Export web audio recorder instance
export const webAudioRecorder = new WebAudioRecorder();