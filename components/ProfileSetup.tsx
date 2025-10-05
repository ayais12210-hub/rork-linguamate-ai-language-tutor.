import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User as UserIcon, Calendar, Target, ChevronRight } from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user, updateUser } = useUser();
  const [name, setName] = useState<string>(user.name ?? '');
  const [dailyGoal, setDailyGoal] = useState<string>(String(user.dailyGoalMinutes ?? 15));

  const canContinue = name.trim().length > 1 && Number.isFinite(Number(dailyGoal)) && Number(dailyGoal) > 0;

  const finish = useCallback(() => {
    try {
      const minutes = Math.max(5, Math.min(180, Math.round(Number(dailyGoal))));
      updateUser({ name: name.trim(), dailyGoalMinutes: minutes, profileCompleted: true });
      onComplete();
    } catch (e) {
      if (__DEV__) {

        console.error('[ProfileSetup] failed', e);

      }
      Alert.alert('Something went wrong', 'Please try again.');
    }
  }, [dailyGoal, name, onComplete, updateUser]);

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}> 
          <UserIcon color="#fff" size={28} />
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Personalize your learning experience</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your name</Text>
          <View style={styles.inputRow}>
            <UserIcon color="#9CA3AF" size={18} />
            <TextInput
              testID="profile-name"
              placeholder="e.g., Alex"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Daily goal (minutes)</Text>
          <View style={styles.inputRow}>
            <Target color="#9CA3AF" size={18} />
            <TextInput
              testID="profile-daily-goal"
              placeholder="15"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          testID="profile-finish"
          onPress={finish}
          disabled={!canContinue}
          style={[styles.cta, !canContinue ? styles.ctaDisabled : undefined]}
        >
          <Text style={[styles.ctaText, !canContinue ? styles.ctaTextDisabled : undefined]}>Finish</Text>
          <ChevronRight color={!canContinue ? '#9CA3AF' : '#fff'} size={18} />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#CBD5E1', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#0b1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1F2937' },
  label: { color: '#E5E7EB', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a0f1a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#111827' },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  cta: { marginTop: 20, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaDisabled: { backgroundColor: '#374151' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ctaTextDisabled: { color: '#9CA3AF' },
});
