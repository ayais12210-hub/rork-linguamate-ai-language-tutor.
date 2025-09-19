import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function SentenceModule({ languageCode, onComplete, onBack }: Props) {
  const data = [
    { id: 'se1', prompt: 'Make a sentence with "eat"', solution: 'I eat apples.' },
    { id: 'se2', prompt: 'Make a sentence with "go"', solution: 'We go home.' },
  ];

  return (
    <ModuleShell title="Sentence Building" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {data.map(s => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.prompt}>{s.prompt}</Text>
          <Text style={styles.solution}>{s.solution}</Text>
        </View>
      ))}
      <TouchableOpacity testID="sentence-complete" style={styles.primary} onPress={onComplete}>
        <Text style={styles.primaryText}>Complete</Text>
      </TouchableOpacity>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 10 },
  prompt: { fontSize: 14, fontWeight: '600', color: '#111827' },
  solution: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '700' },
});