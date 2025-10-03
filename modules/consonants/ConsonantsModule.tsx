import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';
import { Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function ConsonantsModule({ languageCode, onComplete, onBack }: Props) {
  const data = [
    { id: 'c1', symbol: 'B', tip: 'Lips together' },
    { id: 'c2', symbol: 'D', tip: 'Tongue to teeth' },
  ];

  const speak = useCallback(async (text: string) => {
    const t = (text ?? '').toString().trim();
    if (!t) return;
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      await Speech.speak(t, { 
        language: languageCode || 'en', 
        rate: 0.85, 
        pitch: 1.0,
        onError: (error) => {
          console.log('[ConsonantsModule] Speech error:', error);
        }
      });
    } catch (e) {
      console.log('[ConsonantsModule] Speech error:', e);
    }
  }, [languageCode]);

  return (
    <ModuleShell title="Consonants" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {data.map((c, i) => (
        <View key={c.id} style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.symbol}>{c.symbol}</Text>
            <Text style={styles.tip}>{c.tip}</Text>
          </View>
          <TouchableOpacity testID={`consonant-play-${i}`} onPress={() => speak(c.symbol)} style={styles.play}>
            <Volume2 size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity testID="consonants-complete" style={styles.primary} onPress={onComplete}>
        <Text style={styles.primaryText}>Complete</Text>
      </TouchableOpacity>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'column' },
  symbol: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tip: { fontSize: 14, color: '#6B7280' },
  play: { backgroundColor: '#ECFDF5', borderRadius: 999, padding: 8 },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '700' },
});