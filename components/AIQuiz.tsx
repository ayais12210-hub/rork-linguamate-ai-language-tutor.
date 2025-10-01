import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, Zap, X } from 'lucide-react-native';
import { LANGUAGES } from '@/constants/languages';
import type { ModuleType } from '@/modules/types';
import { z } from 'zod';
import { generateObject } from '@rork/toolkit-sdk';

interface AIQuizProps {
  visible: boolean;
  moduleType: ModuleType;
  nativeLangCode: string;
  targetLangCode: string;
  onClose: () => void;
  onFinished: (bonusXp: number) => void;
}

type QuizType = 'multiple_choice' | 'translation' | 'fill_blank';

interface QuizQuestion {
  id: string;
  type: QuizType;
  promptNative: string; // user's native language text/instructions
  promptTarget: string; // target language text
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

const quizSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'translation', 'fill_blank']),
    promptNative: z.string(),
    promptTarget: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string().optional(),
  })).min(5).max(10)
});

export default function AIQuiz({ visible, moduleType, nativeLangCode, targetLangCode, onClose, onFinished }: AIQuizProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [selected, setSelected] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const targetLang = useMemo(() => LANGUAGES.find(l => l.code === targetLangCode), [targetLangCode]);
  const nativeLang = useMemo(() => LANGUAGES.find(l => l.code === nativeLangCode), [nativeLangCode]);

  useEffect(() => {
    if (visible) {
      void loadQuiz();
    } else {
      setQuestions([]);
      setIndex(0);
      setSelected('');
      setAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      setScore(0);
    }
  }, [visible, loadQuiz]);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nativeName = nativeLang?.name ?? 'English';
      const targetName = targetLang?.name ?? 'Spanish';
      const topic = moduleType;

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Create a short quiz of 6-8 questions for the topic "${topic}" to learn ${targetName} for a user whose native language is ${nativeName}. 
- Provide BOTH prompts: 'promptNative' in ${nativeName} and 'promptTarget' in ${targetName}. 
- Mix multiple_choice (with 4 options), translation, and fill_blank. 
- Ensure culturally and linguistically accurate, beginner-friendly where appropriate.
Return only JSON.`,
          },
        ],
        schema: quizSchema,
      });

      const qs = result.questions as QuizQuestion[];
      setQuestions(qs);
    } catch (e: unknown) {
      console.log('[AIQuiz] load error', e);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [moduleType, nativeLang?.name, targetLang?.name]);

  const current = questions[index];

  const check = () => {
    if (!current) return;
    const userAns = current.type === 'multiple_choice' ? selected : answer;
    if (!userAns) return;
    const ok = userAns.trim().toLowerCase() === current.correctAnswer.trim().toLowerCase();
    setIsCorrect(ok);
    setShowResult(true);
    if (ok) setScore(prev => prev + 10);
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex(prev => prev + 1);
      setSelected('');
      setAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      const bonus = Math.round(score * 1.2);
      onFinished(bonus);
    }
  };

  const body = (
    <View style={styles.sheet}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.header}>
        <Text style={styles.title}>AI Quiz</Text>
        <Text style={styles.subtitle}>{nativeLang?.flag} {nativeLang?.name} • {targetLang?.flag} {targetLang?.name}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
          <X size={18} color="#6B7280" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Generating personalized quiz…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={loadQuiz} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : current ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{index + 1} / {questions.length}</Text>
            <View style={styles.scoreRow}>
              <Zap size={16} color="#F59E0B" />
              <Text style={styles.scoreText}>{score}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.promptNative}>{current.promptNative}</Text>
            <Text style={styles.promptTarget}>{current.promptTarget}</Text>
          </View>

          {current.type === 'multiple_choice' && (
            <View style={{ gap: 10 }}>
              {(current.options ?? []).map((opt, i) => (
                <TouchableOpacity
                  key={`${current.id}-opt-${i}`}
                  accessibilityRole="button"
                  onPress={() => !showResult && setSelected(opt)}
                  disabled={showResult}
                  style={[styles.optionBtn,
                    selected === opt && styles.optionSelected,
                    showResult && opt === current.correctAnswer && styles.optionCorrect,
                    showResult && selected === opt && !isCorrect && styles.optionWrong,
                  ]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {current.type !== 'multiple_choice' && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => Alert.alert('Input', 'Type your answer in your head then check. Text input removed for parity on web.')} 
              style={styles.textInputFake}
            >
              <Text style={styles.placeholder}>Think of the answer… tap Check</Text>
            </TouchableOpacity>
          )}

          {!showResult ? (
            <TouchableOpacity
              testID="quiz-check"
              accessibilityRole="button"
              onPress={check}
              disabled={current.type === 'multiple_choice' ? !selected : false}
              style={[styles.primaryBtn, (current.type === 'multiple_choice' ? !selected : false) && styles.disabledBtn]}
            >
              <Text style={styles.primaryText}>Check</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                {isCorrect ? <CheckCircle size={20} color="#10B981" /> : <XCircle size={20} color="#EF4444" />}
                <Text style={styles.resultText}>{isCorrect ? 'Correct' : `Answer: ${current.correctAnswer}`}</Text>
              </View>
              {!!current.explanation && <Text style={styles.explain}>{current.explanation}</Text>}
              <TouchableOpacity testID="quiz-next" accessibilityRole="button" onPress={next} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{index < questions.length - 1 ? 'Next' : 'Finish & Claim XP'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.loadingText}>No quiz available.</Text>
        </View>
      )}
    </View>
  );

  if (Platform.OS === 'web') {
    return visible ? (
      <View style={styles.webOverlay} pointerEvents="auto">
        <View>{body}</View>
      </View>
    ) : null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}><View>{body}</View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  webOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  sheet: { width: '92%', maxHeight: '86%', backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  closeBtn: { position: 'absolute', right: 12, top: 12, padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  center: { padding: 24, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#EF4444', marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: 'white', fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { fontSize: 12, color: '#6B7280' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  card: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  promptNative: { fontSize: 14, color: '#374151', marginBottom: 6 },
  promptTarget: { fontSize: 16, color: '#111827', fontWeight: '600' },
  optionBtn: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  optionSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  textInputFake: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center' },
  placeholder: { color: '#9CA3AF', fontSize: 14 },
  primaryBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  resultBox: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, gap: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  explain: { fontSize: 13, color: '#6B7280' },
  optionText: { fontSize: 14, color: '#1F2937' },
});