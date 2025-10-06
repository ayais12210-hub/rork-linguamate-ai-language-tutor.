import { Result, ok, err, wrapAsync } from '@/lib/errors/result';
import { AppError, createAppError } from '@/lib/errors/AppError';
import { STTProvider, STTResult } from './provider';
import { trackError } from '@/observability/telemetry';

export class EnhancedSTTProvider implements STTProvider {
  private currentProvider: STTProvider | null = null;
  private fallbackProviders: STTProvider[] = [];
  private isListening = false;
  private currentLanguage = 'en-US';
  private onPartialCallback?: (result: STTResult) => void;
  private onErrorCallback?: (error: AppError) => void;

  constructor(providers: STTProvider[]) {
    this.fallbackProviders = providers;
    this.currentProvider = providers[0] || null;
  }

  async start(
    onPartial?: (result: STTResult) => void,
    onError?: (error: AppError) => void
  ): Promise<Result<void>> {
    return wrapAsync(async () => {
      if (this.isListening) {
        throw createAppError(
          'ValidationError',
          'STT is already listening',
          { context: { action: 'start' } }
        );
      }

      this.onPartialCallback = onPartial;
      this.onErrorCallback = onError;

      // Check permissions first
      const permissionResult = await this.requestPermission();
      if (!permissionResult.ok) {
        throw permissionResult.error;
      }

      if (!permissionResult.value) {
        throw createAppError(
          'PermissionError',
          'Microphone permission is required for speech recognition',
          { hint: 'Please enable microphone access in your browser settings' }
        );
      }

      // Try to start with current provider
      let startResult = await this.tryStartWithProvider(this.currentProvider);
      
      // If failed, try fallback providers
      if (!startResult.ok && this.fallbackProviders.length > 1) {
        for (const provider of this.fallbackProviders.slice(1)) {
          this.currentProvider = provider;
          startResult = await this.tryStartWithProvider(provider);
          if (startResult.ok) {
            break;
          }
        }
      }

      if (!startResult.ok) {
        await trackError('stt_start_failed', {
          error: startResult.error,
          context: { language: this.currentLanguage },
        });
        throw startResult.error;
      }

      this.isListening = true;
      await trackError('stt_started', {
        context: { language: this.currentLanguage, provider: this.currentProvider?.constructor.name },
      });
    });
  }

  async stop(): Promise<Result<STTResult>> {
    return wrapAsync(async () => {
      if (!this.isListening || !this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'STT is not currently listening',
          { context: { action: 'stop' } }
        );
      }

      const result = await this.currentProvider.stop();
      this.isListening = false;
      
      await trackError('stt_stopped', {
        context: { 
          language: this.currentLanguage,
          textLength: result.text?.length || 0,
        },
      });

      return result;
    });
  }

  supported(): boolean {
    return this.fallbackProviders.some(provider => provider.supported());
  }

  async requestPermission(): Promise<Result<boolean>> {
    return wrapAsync(async () => {
      if (!this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'No STT provider available',
          { context: { action: 'requestPermission' } }
        );
      }

      const granted = await this.currentProvider.requestPermission();
      return granted;
    });
  }

  async isPermissionGranted(): Promise<Result<boolean>> {
    return wrapAsync(async () => {
      if (!this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'No STT provider available',
          { context: { action: 'isPermissionGranted' } }
        );
      }

      const granted = await this.currentProvider.isPermissionGranted();
      return granted;
    });
  }

  async getAvailableLanguages(): Promise<Result<string[]>> {
    return wrapAsync(async () => {
      if (!this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'No STT provider available',
          { context: { action: 'getAvailableLanguages' } }
        );
      }

      const languages = await this.currentProvider.getAvailableLanguages();
      return languages;
    });
  }

  async setLanguage(language: string): Promise<Result<void>> {
    return wrapAsync(async () => {
      if (!this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'No STT provider available',
          { context: { action: 'setLanguage', language } }
        );
      }

      await this.currentProvider.setLanguage(language);
      this.currentLanguage = language;
    });
  }

  async cancel(): Promise<Result<void>> {
    return wrapAsync(async () => {
      if (!this.isListening || !this.currentProvider) {
        throw createAppError(
          'ValidationError',
          'STT is not currently listening',
          { context: { action: 'cancel' } }
        );
      }

      await this.currentProvider.cancel();
      this.isListening = false;
    });
  }

  private async tryStartWithProvider(provider: STTProvider | null): Promise<Result<void>> {
    if (!provider) {
      return err(createAppError(
        'ValidationError',
        'No STT provider available',
        { context: { action: 'tryStartWithProvider' } }
      ));
    }

    if (!provider.supported()) {
      return err(createAppError(
        'ValidationError',
        'STT provider not supported on this device',
        { context: { provider: provider.constructor.name } }
      ));
    }

    try {
      await provider.start(
        (result) => this.onPartialCallback?.(result),
        (error) => this.onErrorCallback?.(error)
      );
      return ok(undefined);
    } catch (error) {
      const appError = createAppError(
        'UnknownError',
        'Failed to start speech recognition',
        { 
          cause: error,
          context: { provider: provider.constructor.name },
          retryable: true,
        }
      );
      
      return err(appError);
    }
  }
}

// Enhanced TTS provider with similar error handling
export class EnhancedTTSProvider {
  private isSpeaking = false;
  private currentLanguage = 'en-US';
  private currentRate = 1.0;
  private currentPitch = 1.0;

  async speak(
    text: string,
    options: {
      language?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<Result<void>> {
    return wrapAsync(async () => {
      if (this.isSpeaking) {
        throw createAppError(
          'ValidationError',
          'TTS is already speaking',
          { context: { action: 'speak' } }
        );
      }

      if (!text || text.trim().length === 0) {
        throw createAppError(
          'ValidationError',
          'Text to speak cannot be empty',
          { context: { action: 'speak' } }
        );
      }

      try {
        this.isSpeaking = true;
        options.onStart?.();

        // Use Expo Speech API
        const { speak } = await import('expo-speech');
        
        await new Promise<void>((resolve, reject) => {
          speak(text, {
            language: options.language || this.currentLanguage,
            rate: options.rate || this.currentRate,
            pitch: options.pitch || this.currentPitch,
            onDone: () => {
              this.isSpeaking = false;
              options.onEnd?.();
              resolve();
            },
            onError: (error) => {
              this.isSpeaking = false;
              const appError = createAppError(
                'UnknownError',
                'TTS playback failed',
                { cause: error }
              );
              options.onError?.(appError);
              reject(appError);
            },
          });
        });

        await trackError('tts_speak', {
          context: { 
            textLength: text.length,
            language: options.language || this.currentLanguage,
          },
        });
      } catch (error) {
        this.isSpeaking = false;
        const appError = createAppError(
          'UnknownError',
          'Failed to speak text',
          { cause: error }
        );
        
        await trackError('tts_speak_failed', {
          error: appError,
        });
        
        throw appError;
      }
    });
  }

  async stop(): Promise<Result<void>> {
    return wrapAsync(async () => {
      if (!this.isSpeaking) {
        throw createAppError(
          'ValidationError',
          'TTS is not currently speaking',
          { context: { action: 'stop' } }
        );
      }

      const { stop } = await import('expo-speech');
      await stop();
      this.isSpeaking = false;
    });
  }

  async setLanguage(language: string): Promise<Result<void>> {
    return wrapAsync(async () => {
      this.currentLanguage = language;
    });
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}