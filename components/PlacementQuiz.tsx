import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, CheckCircle2, HelpCircle, Loader2, ChevronRight } from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';

interface PlacementQuizProps {
  onComplete: () => void;
}

interface Question {
  id: string;
  prompt: string;
  options: { id: string; text: string; correct?: boolean }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    prompt: 'Choose the correct translation for "Hello"',
    options: [
      { id: 'a', text: 'Hola', correct: true },
      { id: 'b', text: 'Adiós' },
      { id: 'c', text: 'Gracias' },
    ],
  },
  {
    id: 'q2',
    prompt: 'Fill in the blank: I ___ a book.',
    options: [
      { id: 'a', text: 'am read' },
      { id: 'b', text: 'read', correct: true },
      { id: 'c', text: 'reading' },
    ],
  },
  {
    id: 'q3',
    prompt: 'Select the correct sentence',
    options: [
      { id: 'a', text: 'She go to school.' },
      { id: 'b', text: 'She goes to school.', correct: true },
      { id: 'c', text: 'She going to school.' },
    ],
  },
];

export default function PlacementQuiz({ onComplete }: PlacementQuizProps) {
  const { updateUser } = useUser();
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const total = QUESTIONS.length;

  const progressPct = useMemo(() => ((step + 1) / total) * 100, [step, total]);

  const selectOption = useCallback((qid: string, oid: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: oid }));
  }, []);

  const next = useCallback(() => {
    if (step < total - 1) setStep(step + 1);
  }, [step, total]);

  const back = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const finish = useCallback(async () => {
    try {
      setSubmitting(true);
      const score = QUESTIONS.reduce((acc, q) => {
        const chosen = answers[q.id];
        const correct = q.options.find((o) => o.correct)?.id;
        return acc + (chosen === correct ? 1 : 0);
      }, 0);

      const pct = score / total;
      const inferred: 'beginner' | 'intermediate' | 'advanced' =
        pct < 0.4 ? 'beginner' : pct < 0.8 ? 'intermediate' : 'advanced';

      updateUser({ proficiencyLevel: inferred, placementCompleted: true });
      onComplete();
    } catch (e) {
      if (__DEV__) {

        console.error('[PlacementQuiz] failed', e);

      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, total, updateUser, onComplete]);

  const q = QUESTIONS[step];

  return (
    <LinearGradient colors={['#111827', '#1F2937']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain color="#fff" size={24} />
          <Text style={styles.headerTitle}>Placement Quiz</Text>
        </View>
        <Text accessibilityLabel={`progress-${Math.round(progressPct)}-percent`} style={styles.headerProgress}>
          {Math.round(progressPct)}%
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <Text testID="question-prompt" style={styles.prompt}>{q.prompt}</Text>
        {q.options.map((opt) => {
          const isSelected = answers[q.id] === opt.id;
          return (
            <TouchableOpacity
              key={`${q.id}-${opt.id}`}
              accessibilityRole="button"
              testID={`option-${q.id}-${opt.id}`}
              onPress={() => selectOption(q.id, opt.id)}
              style={[styles.option, isSelected ? styles.optionSelected : undefined]}
            >
              <View style={styles.optionLeft}>
                {isSelected ? <CheckCircle2 color="#fff" size={18} /> : <HelpCircle color="#9CA3AF" size={18} />}
                <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : undefined]}>
                  {opt.text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="back"
          disabled={step === 0 || submitting}
          onPress={back}
          style={[styles.navBtn, step === 0 || submitting ? styles.navBtnDisabled : undefined]}
        >
          <Text style={[styles.navText, step === 0 || submitting ? styles.navTextDisabled : undefined]}>Back</Text>
        </TouchableOpacity>
        {step < total - 1 ? (
          <TouchableOpacity
            testID="next"
            disabled={!answers[q.id] || submitting}
            onPress={next}
            style={[styles.primaryBtn, !answers[q.id] || submitting ? styles.primaryBtnDisabled : undefined]}
          >
            <Text style={[styles.primaryText, !answers[q.id] || submitting ? styles.primaryTextDisabled : undefined]}>Continue</Text>
            <ChevronRight color={!answers[q.id] || submitting ? '#9CA3AF' : '#fff'} size={18} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="finish"
            disabled={Object.keys(answers).length < total || submitting}
            onPress={finish}
            style={[styles.primaryBtn, Object.keys(answers).length < total || submitting ? styles.primaryBtnDisabled : undefined]}
          >
            {submitting ? (
              <>
                <Loader2 color="#9CA3AF" size={18} />
                <Text style={[styles.primaryText, styles.primaryTextDisabled]}>Evaluating…</Text>
              </>
            ) : (
              <>
                <Text style={styles.primaryText}>Finish & Set Level</Text>
                <ChevronRight color="#fff" size={18} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerProgress: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#374151', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#60A5FA', borderRadius: 2 },
  content: { flex: 1, marginTop: 16 },
  contentInner: { paddingHorizontal: 20, paddingBottom: 24 },
  prompt: { fontSize: 20, fontWeight: '700', color: '#F9FAFB', marginBottom: 16 },
  option: { padding: 16, borderRadius: 12, backgroundColor: '#111827', borderWidth: 2, borderColor: '#1F2937', marginBottom: 12 },
  optionSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { color: '#E5E7EB', fontSize: 16, fontWeight: '600' },
  optionTextSelected: { color: '#fff' },
  footer: { flexDirection: 'row', gap: 12, padding: 20 },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#1F2937' },
  navBtnDisabled: { opacity: 0.5 },
  navText: { color: '#E5E7EB', fontSize: 16, fontWeight: '600' },
  navTextDisabled: { color: '#9CA3AF' },
  primaryBtn: { flex: 2, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#3B82F6' },
  primaryBtnDisabled: { backgroundColor: '#374151' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  primaryTextDisabled: { color: '#9CA3AF' },
});
