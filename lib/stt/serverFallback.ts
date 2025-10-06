import { STTProvider, STTResult } from './provider';

export class ServerSTT implements STTProvider {
  private chunks: Blob[] = [];

  supported() {
    return true;
  }

  async start() {
    this.chunks = [];
  }

  async stop(): Promise<STTResult> {
    // In a real app you'd POST audio; here we hit the mocked endpoint
    const r = await fetch('/api/stt', { method: 'POST' });
    const j = await r.json();
    return { text: (j?.text ?? '').trim() };
  }
}
