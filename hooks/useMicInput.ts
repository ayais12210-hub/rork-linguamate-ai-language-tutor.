import { useCallback, useRef, useState } from 'react';
import { getSTT } from '@/lib/stt';

type State = 'idle' | 'recording' | 'processing';

export function useMicInput(onText: (t: string) => void) {
  const [state, setState] = useState<State>('idle');
  const providerRef = useRef(getSTT());

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('recording');
    await providerRef.current.start((partial) => onText(partial));
  }, [state, onText]);

  const stop = useCallback(async () => {
    if (state !== 'recording') return;
    setState('processing');
    const { text } = await providerRef.current.stop();
    if (text) onText(text);
    setState('idle');
  }, [state, onText]);

  return { state, start, stop };
}
