import { STTProvider, STTResult } from './provider';

export class WebSpeechSTT implements STTProvider {
  private rec?: SpeechRecognition;
  private buffer = '';

  supported() {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  async start(onPartial?: (t: string) => void) {
    const AnyRec: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.rec = new AnyRec();
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      this.buffer = t;
      onPartial?.(t);
    };
    this.rec.start();
  }

  async stop(): Promise<STTResult> {
    this.rec?.stop();
    return { text: this.buffer.trim() };
  }
}
