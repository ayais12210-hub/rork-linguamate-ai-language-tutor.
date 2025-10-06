import { WebSpeechSTT } from './webSpeech';
import { ServerSTT } from './serverFallback';
import { EnhancedSTTProvider, EnhancedTTSProvider } from './enhancedSTT';
import type { STTProvider } from './provider';

export function getSTT(): STTProvider {
  const providers: STTProvider[] = [];
  
  if (typeof window !== 'undefined') {
    const web = new WebSpeechSTT();
    if (web.supported()) {
      providers.push(web);
    }
  }
  
  providers.push(new ServerSTT());
  
  return new EnhancedSTTProvider(providers);
}

export function getTTS(): EnhancedTTSProvider {
  return new EnhancedTTSProvider();
}

export type { STTProvider, STTResult } from './provider';
export { EnhancedSTTProvider, EnhancedTTSProvider } from './enhancedSTT';
