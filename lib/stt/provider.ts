export type STTResult = { text: string };

export interface STTProvider {
  start(onPartial?: (t: string) => void): Promise<void>;
  stop(): Promise<STTResult>;
  supported(): boolean;
}
