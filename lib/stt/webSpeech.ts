import { STTProvider, STTResult } from './provider';
import { ok, err, Result } from '@/lib/errors/result';
import { createAppError } from '@/lib/errors/AppError';

export class WebSpeechSTT implements STTProvider {
  private rec?: any;
  private buffer = '';

  supported() {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  async start(onPartial?: (result: STTResult) => void): Promise<Result<void>> {
    try {
      const AnyRec: any =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!AnyRec) {
        return err(createAppError('UnknownError', 'Web Speech API not available'));
      }
      this.rec = new AnyRec();
      this.rec.continuous = true;
      this.rec.interimResults = true;
      this.rec.onresult = (e: any) => {
        const t = Array.from(e.results as SpeechRecognitionResultList)
          .map((r: SpeechRecognitionResult) => r[0].transcript)
          .join(' ');
        this.buffer = t;
        onPartial?.({ text: t });
      };
      this.rec.start();
      return ok(undefined as unknown as void);
    } catch (e) {
      return err(createAppError('UnknownError', 'Failed to start speech recognition', { cause: e }));
    }
  }

  async stop(): Promise<Result<STTResult>> {
    try {
      this.rec?.stop();
      return ok({ text: this.buffer.trim() });
    } catch (e) {
      return err(createAppError('UnknownError', 'Failed to stop speech recognition', { cause: e }));
    }
  }

  async requestPermission(): Promise<Result<boolean>> {
    // Browser Web Speech has no explicit permission API; assume true when available
    return ok(true);
  }

  async isPermissionGranted(): Promise<Result<boolean>> {
    return ok(true);
  }

  async getAvailableLanguages(): Promise<Result<string[]>> {
    return ok([]);
  }

  async setLanguage(_language: string): Promise<Result<void>> {
    if (this.rec) {
      this.rec.lang = _language;
    }
    return ok(undefined as unknown as void);
  }

  async cancel(): Promise<Result<void>> {
    try {
      this.rec?.abort?.();
      return ok(undefined as unknown as void);
    } catch (e) {
      return err(createAppError('UnknownError', 'Failed to cancel speech recognition', { cause: e }));
    }
  }
}
