import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as Speech from 'expo-speech';

export interface PhonemeItem {
  id: string;
  sound: string;
  ipa?: string;
  graphemes: string[];
  examples: { word: string; translation: string }[];
  mouthHint?: string;
}

interface Props {
  items: PhonemeItem[];
  targetLangCode?: string;
  onComplete?: (score: number) => void;
  testIDPrefix?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PhonicsTrainer: React.FC<Props> = ({ items, targetLangCode, onComplete, testIDPrefix = 'phonics-trainer' }) => {
  const [index, setIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answered, setAnswered] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const flatGraphemes = useMemo<string[]>(() => {
    const g: string[] = [];
    (items || []).forEach(p => {
      (p.graphemes || []).forEach(gr => {
        if (!g.includes(gr)) g.push(gr);
      });
    });
    return g;
  }, [items]);

  const current = items?.[index];

  const choices = useMemo<string[]>(() => {
    if (!current) return [];
    const correct = (current.graphemes?.[0] ?? '').toString();
    const distr = shuffle(flatGraphemes.filter(g => g !== correct)).slice(0, 3);
    return shuffle([correct, ...distr]);
  }, [current, flatGraphemes]);

  const speak = useCallback((text: string) => {
    const t = (text ?? '').toString().trim();
    if (!t || t.length > 100) return;
    try {
      console.log('[PhonicsTrainer] speak', t, targetLangCode);
      Speech.speak(t, { language: targetLangCode, rate: 0.95, pitch: 1.0 });
    } catch (e) {
      console.error('Speech error', e);
    }
  }, [targetLangCode]);

  const onChoose = useCallback((choice: string) => {
    if (!current || answered) return;
    setSelected(choice);
    const correct = current.graphemes?.[0] ?? '';
    const isCorrect = choice === correct;
    setAnswered(true);
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (index < items.length - 1) {
        setIndex(i => i + 1);
        setAnswered(false);
        setSelected(null);
      } else {
        onComplete?.(isNaN(score + (isCorrect ? 1 : 0)) ? 0 : score + (isCorrect ? 1 : 0));
      }
    }, 600);
  }, [answered, current, index, items.length, onComplete, score]);

  if (!items || items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No phonics items available.</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#F43F5E" />
      </View>
    );
  }

  return (
    <View style={styles.wrap} testID={`${testIDPrefix}-root`}>
      <View style={styles.headerRow}>
        <Text style={styles.progress}>{index + 1} / {items.length}</Text>
        <Text style={styles.score}>Score {score}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sound}>{current.sound}{current.ipa ? ` · ${current.ipa}` : ''}</Text>
        {!!current.mouthHint && <Text style={styles.hint}>{current.mouthHint}</Text>}
        <View style={styles.examplesRow}>
          {current.examples.slice(0, 2).map((ex, i) => (
            <TouchableOpacity
              key={`${current.id}_ex_${i}`}
              onPress={() => speak(ex.word)}
              style={styles.examplePill}
              testID={`${testIDPrefix}-example-${i}`}
            >
              <Text style={styles.exampleWord}>{ex.word}</Text>
              <Text style={styles.exampleTrans}>{ex.translation}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.choices}>
        {choices.map((c, i) => {
          const isCorrect = current.graphemes?.[0] === c;
          const selectedStyle = answered
            ? (isCorrect ? styles.choiceCorrect : (selected === c ? styles.choiceWrong : styles.choiceIdle))
            : styles.choiceIdle;

          return (
            <TouchableOpacity
              key={`${current.id}_choice_${i}`}
              style={[styles.choiceBtn, selectedStyle]}
              onPress={() => onChoose(c)}
              disabled={answered}
              testID={`${testIDPrefix}-choice-${i}`}
            >
              <Text style={styles.choiceText}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={() => speak(current.sound)} style={styles.pronounceBtn} testID={`${testIDPrefix}-pronounce`}>
        <Text style={styles.pronounceText}>Play sound</Text>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(PhonicsTrainer);

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF1F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progress: { fontSize: 12, color: '#6B7280' },
  score: { fontSize: 12, color: '#111827', fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 10 },
  sound: { fontSize: 18, fontWeight: '800', color: '#111827' },
  hint: { marginTop: 6, fontSize: 12, color: '#DC2626' },
  examplesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  examplePill: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, marginRight: 8 },
  exampleWord: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  exampleTrans: { fontSize: 10, color: '#047857' },
  choices: { gap: 8 },
  choiceBtn: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  choiceText: { fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'center' },
  choiceIdle: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  choiceCorrect: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0' },
  choiceWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  pronounceBtn: { alignSelf: 'center', marginTop: 10, backgroundColor: '#FFE4E6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pronounceText: { color: '#9F1239', fontWeight: '800', fontSize: 12 },
  empty: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: '#6B7280' },
  center: { padding: 12, alignItems: 'center', justifyContent: 'center' },
});
