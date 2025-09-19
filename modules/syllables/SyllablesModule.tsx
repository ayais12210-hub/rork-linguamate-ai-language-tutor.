import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function SyllablesModule({ languageCode, onComplete, onBack }: Props) {
  const data = [
    { id: 's1', syllable: 'ba', example: 'ba-na-na' },
    { id: 's2', syllable: 'ta', example: 'to-ma-to' },
  ];

  return (
    <ModuleShell title="Syllables" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {data.map(s => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.symbol}>{s.syllable}</Text>
          <Text style={styles.tip}>{s.example}</Text>
        </View>
      ))}
      <TouchableOpacity testID="syllables-complete" style={styles.primary} onPress={onComplete}>
        <Text style={styles.primaryText}>Complete</Text>
      </TouchableOpacity>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  symbol: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tip: { fontSize: 14, color: '#6B7280' },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '700' },
});