import { STTProvider, STTResult } from './provider';
import { Result, ok, err } from '@/lib/errors/result';
import { createAppError } from '@/lib/errors/AppError';

export class ServerSTT implements STTProvider {
  private chunks: Blob[] = [];

  supported() {
    return true;
  }

  async start(): Promise<Result<void>> {
    try {
      this.chunks = [];
      return ok(undefined as unknown as void);
    } catch (e) {
      return err(createAppError('UnknownError', 'Failed to start server STT', { cause: e }));
    }
  }

  async stop(): Promise<Result<STTResult>> {
    try {
      // In a real app you'd POST audio; here we hit the mocked endpoint
      const r = await fetch('/api/stt', { method: 'POST' });
      if (!r.ok) {
        return err(createAppError('NetworkError', `HTTP ${r.status}`));
      }
      const j = await r.json();
      return ok({ text: (j?.text ?? '').trim() });
    } catch (e) {
      return err(createAppError('UnknownError', 'Failed to stop server STT', { cause: e }));
    }
  }

  async requestPermission(): Promise<Result<boolean>> {
    return ok(true);
  }

  async isPermissionGranted(): Promise<Result<boolean>> {
    return ok(true);
  }

  async getAvailableLanguages(): Promise<Result<string[]>> {
    return ok([]);
  }

  async setLanguage(_language: string): Promise<Result<void>> {
    return ok(undefined as unknown as void);
  }

  async cancel(): Promise<Result<void>> {
    return ok(undefined as unknown as void);
  }
}
