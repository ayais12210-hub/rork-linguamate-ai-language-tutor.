import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function VowelsModule({ languageCode, onComplete, onBack }: Props) {
  const data = [
    { id: 'v1', symbol: 'A', sound: '/a/' },
    { id: 'v2', symbol: 'E', sound: '/e/' },
  ];

  return (
    <ModuleShell title="Vowels" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {data.map(v => (
        <View key={v.id} style={styles.row}>
          <Text style={styles.symbol}>{v.symbol}</Text>
          <Text style={styles.sound}>{v.sound}</Text>
        </View>
      ))}
      <TouchableOpacity testID="vowels-complete" style={styles.primary} onPress={onComplete}>
        <Text style={styles.primaryText}>Complete</Text>
      </TouchableOpacity>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  symbol: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sound: { fontSize: 14, color: '#6B7280' },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '700' },
});