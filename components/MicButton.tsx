import { Pressable, View, ActivityIndicator } from 'react-native';
import { useMicInput } from '@/hooks/useMicInput';

export function MicButton({ onInsert }: { onInsert: (t: string) => void }) {
  const { state, start, stop } = useMicInput(onInsert);
  const busy = state !== 'idle';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Stop recording' : 'Start recording'}
      onPress={busy ? stop : start}
      style={{ padding: 12, borderRadius: 9999, borderWidth: 1 }}
    >
      <View>{busy ? <ActivityIndicator /> : null /* replace with mic icon */}</View>
    </Pressable>
  );
}
