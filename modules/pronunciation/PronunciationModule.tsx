import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import ModuleShell from '@/modules/shared/ModuleShell';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function PronunciationModule({ languageCode, onComplete, onBack }: Props) {
  const record = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Recording', 'Web recording is not enabled in this preview.');
    } else {
      Alert.alert('Recording', 'Recording on device not implemented in this module yet.');
    }
  };

  return (
    <ModuleShell title="Pronunciation" subtitle={`Language: ${languageCode}`} onBack={onBack} onComplete={onComplete}>
      <View style={styles.card}>
        <Text style={styles.desc}>Practice pronouncing short phrases and compare later.</Text>
        <TouchableOpacity testID="pronunciation-record" style={styles.secondary} onPress={record}>
          <Text style={styles.secondaryText}>Record</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="pronunciation-complete" style={styles.primary} onPress={onComplete}>
          <Text style={styles.primaryText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  desc: { fontSize: 14, color: '#374151', marginBottom: 12 },
  primary: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '700' },
  secondary: { backgroundColor: '#E5E7EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  secondaryText: { color: '#111827', fontWeight: '600' },
});