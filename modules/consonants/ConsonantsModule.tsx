import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

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

  return (
    <ModuleShell title="Consonants" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {data.map(c => (
        <View key={c.id} style={styles.row}>
          <Text style={styles.symbol}>{c.symbol}</Text>
          <Text style={styles.tip}>{c.tip}</Text>
        </View>
      ))}
      <TouchableOpacity testID="consonants-complete" style={styles.primary} onPress={onComplete}>
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