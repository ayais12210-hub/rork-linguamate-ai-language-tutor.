import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMicInput } from '@/hooks/useMicInput';

// Mock the STT module
jest.mock('@/lib/stt', () => ({
  getSTT: () => ({
    start: jest.fn(async (cb: (r: { text: string }) => void) => {
      cb({ text: 'partial' });
      return { ok: true, value: undefined } as const;
    }),
    stop: jest.fn(async () => ({ ok: true, value: { text: 'final text' } } as const)),
    supported: () => true,
  }),
}));

describe('useMicInput', () => {
  it('should start in idle state', () => {
    const onText = jest.fn();
    const { result } = renderHook(() => useMicInput(onText));
    
    expect(result.current.state).toBe('idle');
  });

  it('should cycle through recording → processing → idle and return text', async () => {
    const onText = jest.fn();
    const { result } = renderHook(() => useMicInput(onText));

    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.start();
    });
    
    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    await act(async () => {
      await result.current.stop();
    });
    
    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
    
    expect(onText).toHaveBeenCalledWith('final text');
  });

  it('should not start if already recording', async () => {
    const onText = jest.fn();
    const { result } = renderHook(() => useMicInput(onText));

    await act(async () => {
      await result.current.start();
    });

    const state1 = result.current.state;
    
    await act(async () => {
      await result.current.start(); // Try to start again
    });
    
    const state2 = result.current.state;
    expect(state1).toBe(state2);
  });
});
