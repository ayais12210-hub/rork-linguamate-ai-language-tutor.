import { Result } from '@/lib/errors/result';
import { AppError } from '@/lib/errors/AppError';

export type STTResult = { 
  text: string;
  confidence?: number;
  isFinal?: boolean;
  language?: string;
};

export interface STTProvider {
  start(onPartial?: (result: STTResult) => void, onError?: (error: AppError) => void): Promise<Result<void>>;
  stop(): Promise<Result<STTResult>>;
  supported(): boolean;
  requestPermission(): Promise<Result<boolean>>;
  isPermissionGranted(): Promise<Result<boolean>>;
  getAvailableLanguages(): Promise<Result<string[]>>;
  setLanguage(language: string): Promise<Result<void>>;
  cancel(): Promise<Result<void>>;
}
