export { ElevenLabsAudioEngine } from './elevenlabs';
export { AWSAudioEngine } from './aws';
export { GoogleAudioEngine } from './google';

// Factory function to create audio engines
import { AudioEngine, AudioConfig } from '../../patterns/context/AudioEngineContext';
import { ElevenLabsAudioEngine } from './elevenlabs';
import { AWSAudioEngine } from './aws';
import { GoogleAudioEngine } from './google';

export function createAudioEngine(
  provider: AudioConfig['provider'],
  config: {
    apiKey?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }
): AudioEngine {
  switch (provider) {
    case 'elevenlabs':
      if (!config.apiKey) {
        throw new Error('ElevenLabs API key is required');
      }
      return new ElevenLabsAudioEngine(config.apiKey);
    
    case 'aws':
      if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
        throw new Error('AWS region, access key ID, and secret access key are required');
      }
      return new AWSAudioEngine(config.region, config.accessKeyId, config.secretAccessKey);
    
    case 'google':
      if (!config.apiKey) {
        throw new Error('Google API key is required');
      }
      return new GoogleAudioEngine(config.apiKey);
    
    case 'expo':
    default:
      // Return null to use the default Expo implementation
      return null as any;
  }
}