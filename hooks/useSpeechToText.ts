import { useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

type Listener = (text: string) => void;

export function useSpeechToText() {
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en-GB');
  const [transcript, setTranscript] = useState<string>('');
  const listeners = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    const w = globalThis as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      recognitionRef.current.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
        listeners.current.forEach((fn) => fn(text));
      };
      recognitionRef.current.onend = () => setListening(false);
      setSupported(true);
    } else {
      setSupported(false);
    }
  }, [language]);

  const start = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const stop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const onTranscript = (fn: Listener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  };

  const speak = (text: string, voice?: string) => {
    Speech.speak(text, { language, voice });
  };

  return {
    supported,
    listening,
    language,
    setLanguage,
    transcript,
    start,
    stop,
    onTranscript,
    speak,
  };
}
