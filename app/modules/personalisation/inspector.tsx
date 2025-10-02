import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { usePreferenceProfile } from './profile-store';
import { buildTrace } from './explain';

export default function ProfileInspector() {
  const { profile } = usePreferenceProfile();
  const traces = useMemo(() => {
    if (!profile) return [];
    return buildTrace({
      goal: 'conversation',
      level: 'A1',
      timePerDay: '10',
      focus: { speaking: 20, listening: 20, reading: 20, writing: 10, grammar: 15, vocab: 15 },
      pronunConfidence: 'medium',
      accessibility: {},
    } as any, profile);
  }, [profile]);

  if (!profile) {
    return (
      <View style={styles.center} testID="profile-inspector-empty">
        <Text>No profile loaded</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="profile-inspector">
      <Text style={styles.title}>Preference Profile</Text>
      <Text selectable style={styles.mono}>{JSON.stringify(profile, null, 2)}</Text>
      <Text style={[styles.title, { marginTop: 16 }]}>Rules Applied</Text>
      {traces.map((t) => (
        <Text key={t.id} style={styles.item}>• {t.title}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#111827' },
  item: { fontSize: 14, color: '#374151', marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
