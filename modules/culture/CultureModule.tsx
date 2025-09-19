import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function CultureModule({ languageCode, onComplete, onBack }: Props) {
  const notes = [
    { id: 'cu1', topic: 'Greetings etiquette', tip: 'Formal vs informal address' },
    { id: 'cu2', topic: 'Meal customs', tip: 'Common table phrases' },
  ];

  return (
    <ModuleShell title="Culture" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      {notes.map(n => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.topic}>{n.topic}</Text>
          <Text style={styles.tip}>{n.tip}</Text>
        </View>
      ))}
      <TouchableOpacity testID="culture-complete" style={styles.primary} onPress={onComplete}>
        <Text style={styles.primaryText}>Complete</Text>
      </TouchableOpacity>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 10 },
  topic: { fontSize: 16, fontWeight: '700', color: '#111827' },
  tip: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '700' },
});