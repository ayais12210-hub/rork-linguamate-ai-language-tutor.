import { WebSpeechSTT } from './webSpeech';
import { ServerSTT } from './serverFallback';
import type { STTProvider } from './provider';

export function getSTT(): STTProvider {
  if (typeof window !== 'undefined') {
    const web = new WebSpeechSTT();
    if (web.supported()) return web;
  }
  return new ServerSTT();
}

export type { STTProvider, STTResult } from './provider';
