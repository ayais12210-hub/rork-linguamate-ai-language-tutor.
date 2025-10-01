import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, TextInput, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GraduationCap, Volume2, RefreshCw, ChevronRight, Lightbulb, Sparkles, Grid, Hash, Quote, Trophy, Target, ShieldCheck, Flame, Star, CheckCircle2, XCircle, Shuffle, Play, BookOpen, Waves, Mic, Square, PlayCircle } from 'lucide-react-native';
import { trpcClient } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useGamification } from '@/hooks/use-gamification';
import PhonicsTrainer from '@/components/PhonicsTrainer';
import { useSpeech } from '@/hooks/use-speech';

interface AlphabetEntry {
  id: string;
  character: string;
  romanization?: string;
  pronunciation: string;
  type: 'vowel' | 'consonant' | 'special';
  examples: { word: string; translation: string; pronunciation?: string }[];
  difficulty: number;
}

interface PhonicsEntry {
  id: string;
  sound: string;
  ipa?: string;
  graphemes: string[];
  examples: { word: string; translation: string }[];
  mouthHint?: string;
}

interface GrammarEntry {
  id: string;
  title: string;
  explanation: string;
  examples: { target: string; native: string }[];
}

interface DialogueTurn {
  speaker: string;
  target: string;
  native: string;
}

interface DialogueEntry {
  id: string;
  scene: string;
  turns: DialogueTurn[];
}

interface LearnPayload {
  alphabet: AlphabetEntry[];
  numbers: { value: number; target: string; pronunciation?: string }[];
  commonWords: { target: string; native: string; pronunciation?: string; theme: string }[];
  phrases: { target: string; native: string; pronunciation?: string; context: string }[];
  tips: string[];
  phonics?: PhonicsEntry[];
  grammar?: GrammarEntry[];
  dialogues?: DialogueEntry[];
}

type QuizItem = {
  prompt: string;
  correct: string;
  choices: string[];
  kind: 'word' | 'phrase' | 'number' | 'alphabet';
};

export default function LearnScreen() {
  const { user, updateStats } = useUser();
  const insets = useSafeAreaInsets();
  const { currentLeague, unlockedAchievements, achievementProgress, userRank, leaderboard, xpToNextLeague, nextLeague } = useGamification();
  const [data, setData] = useState<LearnPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [alphaMode, setAlphaMode] = useState<'grid' | 'list'>('grid');
  const [alphaShowTranslation, setAlphaShowTranslation] = useState<boolean>(true);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [practiceText, setPracticeText] = useState<string>('');
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<string>('');
  const [fixingLang, setFixingLang] = useState<boolean>(false);
  const speech = useSpeech();

  const targetLang = useMemo(() => LANGUAGES.find(l => l.code === user.selectedLanguage), [user.selectedLanguage]);
  const nativeLang = useMemo(() => LANGUAGES.find(l => l.code === user.nativeLanguage), [user.nativeLanguage]);

  const learnQuery = useQuery({
    queryKey: ['learn', targetLang?.code, nativeLang?.code],
    enabled: !!targetLang && !!nativeLang,
    queryFn: async () => {
      if (!targetLang || !nativeLang) throw new Error('Languages not selected');
      const payload = await trpcClient.learn.getContent.query({ targetName: targetLang.name, nativeName: nativeLang.name });
      return payload as LearnPayload;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (learnQuery.data) {
      setData(learnQuery.data);
    }
    if (learnQuery.error) {
      console.error('[Learn] tRPC error', learnQuery.error);
      setError('Could not load learning content. Using basic offline set. Tap refresh to try again.');
      if (!data) {
        const fallback: LearnPayload = buildFallbackContent(nativeLang?.name ?? 'English', targetLang?.name ?? 'Target');
        setData(fallback);
      }
    }
  }, [learnQuery.data, learnQuery.error]);

  const fetchLearnData = useCallback(async () => {
    if (!targetLang || !nativeLang) {
      setError('Please select your native and learning languages in settings.');
      return;
    }
    setError(null);
    await learnQuery.refetch();
  }, [learnQuery, targetLang, nativeLang]);

  const sectionHeader = useCallback((icon: React.ReactElement, title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View>{React.isValidElement(icon) ? icon : null}</View>
        <Text style={styles.sectionTitle} testID={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>{title}</Text>
      </View>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  ), []);

  const needsFix = useMemo(() => {
    const cw = data?.commonWords ?? [];
    if (cw.length === 0) return false;
    const same = cw.filter(w => (w.target || '').toLowerCase() === (w.native || '').toLowerCase());
    return same.length >= Math.max(6, Math.floor(cw.length * 0.6));
  }, [data]);

  React.useEffect(() => {
    let cancelled = false;
    async function runFix() {
      if (!data || !targetLang || !nativeLang) return;
      if (!needsFix) return;
      try {
        setFixingLang(true);
        const pack = {
          numbers: data.numbers?.slice(0, 30) ?? [],
          words: (data.commonWords ?? []).slice(0, 40).map(w => w.native),
          phrases: (data.phrases ?? []).slice(0, 30).map(p => p.native),
        };
        const prompt = `Translate the provided items from ${nativeLang.name} into ${targetLang.name}. Return ONLY JSON with keys numbers, words, phrases.
- numbers: map each value to its target string: [{value, target}]
- words: array of translated strings in same order
- phrases: array of translated strings in same order`;
        const res = await fetch('https://toolkit.rork.com/text/llm/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [
            { role: 'system', content: 'You are a precise translator. Keep output terse. No markdown.' },
            { role: 'user', content: `${prompt}\nSOURCE JSON:\n${JSON.stringify(pack)}` },
          ]}),
        });
        if (!res.ok) throw new Error('translate_failed');
        const j = await res.json() as { completion?: string };
        let content = String(j.completion ?? '').trim();
        const match = content.match(/\{[\s\S]*\}/);
        if (match) content = match[0];
        const parsed = JSON.parse(content) as { numbers?: Array<{ value: number; target: string }>; words?: string[]; phrases?: string[] };
        const fixed: LearnPayload = {
          ...data,
          numbers: (data.numbers ?? []).map(n => {
            const f = parsed.numbers?.find(x => x.value === n.value);
            return { ...n, target: f?.target ?? n.target };
          }),
          commonWords: (data.commonWords ?? []).map((w, i) => ({ ...w, target: parsed.words?.[i] ?? w.target })),
          phrases: (data.phrases ?? []).map((p, i) => ({ ...p, target: parsed.phrases?.[i] ?? p.target })),
        };
        if (!cancelled) setData(fixed);
      } catch (e) {
        console.log('[Learn] translate fallback failed', e);
      } finally {
        if (!cancelled) setFixingLang(false);
      }
    }
    runFix();
    return () => { cancelled = true; };
  }, [needsFix, data, targetLang, nativeLang]);

  const onPlay = useCallback((raw: string) => {
    const label = (raw ?? '').toString().trim();
    if (!label || label.length > 200) return;
    try {
      if (Platform.OS === 'web') {
        console.log('[Learn] speak web:', label);
        Speech.speak(label, { language: targetLang?.code, pitch: 1.0, rate: 0.95 });
      } else {
        console.log('[Learn] speak native:', label);
        Speech.speak(label, { language: targetLang?.code, pitch: 1.0, rate: 0.95 });
      }
    } catch (e) {
      console.error('Speech error', e);
    }
  }, [targetLang?.code]);

  const filteredWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data?.commonWords ?? [];
    return (data?.commonWords ?? []).filter(w =>
      (w.target?.toLowerCase().includes(q)) || (w.native?.toLowerCase().includes(q)) || (w.theme?.toLowerCase().includes(q))
    );
  }, [search, data?.commonWords]);

  const groupedVocabulary = useMemo(() => {
    const groups: Record<string, { target: string; native: string; pronunciation?: string; theme: string }[]> = {};
    (filteredWords || []).forEach(w => {
      const key = w.theme || 'general';
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });
    return groups;
  }, [filteredWords]);

  const phonics: PhonicsEntry[] = useMemo(() => {
    if (data?.phonics && data.phonics.length > 0) return data.phonics;
    const vowels = (data?.alphabet || []).filter(a => a.type === 'vowel').slice(0, 6);
    const cons = (data?.alphabet || []).filter(a => a.type === 'consonant').slice(0, 6);
    const base: PhonicsEntry[] = [
      ...vowels.map((v, i) => ({
        id: `v_${i}`,
        sound: v.pronunciation,
        ipa: `/${v.pronunciation}/`,
        graphemes: [v.character].filter(Boolean),
        examples: (v.examples || []).slice(0, 2).map(e => ({ word: e.word, translation: e.translation })),
        mouthHint: 'Relaxed jaw, open mouth; keep the tongue low.',
      })),
      ...cons.map((c, i) => ({
        id: `c_${i}`,
        sound: c.pronunciation,
        ipa: `/${c.pronunciation}/`,
        graphemes: [c.character].filter(Boolean),
        examples: (c.examples || []).slice(0, 2).map(e => ({ word: e.word, translation: e.translation })),
        mouthHint: 'Touch-and-release with the tip of the tongue; add subtle aspiration.',
      })),
    ];
    return base;
  }, [data?.phonics, data?.alphabet]);

  const cards = useMemo(() => (data?.commonWords ?? []).slice(0, 20), [data?.commonWords]);

  const practiceCandidates = useMemo(() => {
    const fromPhonics = phonics.flatMap(ph => ph.examples.slice(0, 1).map(e => e.word));
    const fromWords = (data?.commonWords ?? []).slice(0, 10).map(w => w.target);
    return [...fromPhonics, ...fromWords].filter(Boolean);
  }, [phonics, data?.commonWords]);

  const progressWidthStyle = useMemo(() => ({ width: `${Math.min(100, achievementProgress).toFixed(0)}%` }), [achievementProgress]);

  const swipe = useCallback((dir: 'left' | 'right') => {
    Animated.timing(pan, { toValue: { x: dir === 'right' ? 500 : -500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setCardIndex(i => {
        const next = i + 1;
        if (dir === 'right') {
          updateStats({ xpPoints: (user.stats?.xpPoints || 0) + 2 });
        }
        return next >= cards.length ? 0 : next;
      });
    });
  }, [pan, updateStats, user.stats?.xpPoints, cards.length]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_evt, gesture) => {
      if (gesture.dx > 120) {
        swipe('right');
      } else if (gesture.dx < -120) {
        swipe('left');
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
  }), [pan, swipe]);

  const computeAccuracy = useCallback((expected: string, actual: string) => {
    const a = (expected || '').toLowerCase().trim();
    const b = (actual || '').toLowerCase().trim();
    if (!a || !b) return 0;
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    const dist = dp[a.length][b.length];
    const maxLen = Math.max(a.length, b.length) || 1;
    const score = Math.max(0, 1 - dist / maxLen);
    return Math.round(score * 100);
  }, []);

  const handleTranscribeAndScore = useCallback(async () => {
    if (!practiceText) return;
    const res = await speech.stopRecording();
    const tr = await speech.transcribeAudio(undefined, targetLang?.code);
    if (tr?.text) {
      const score = computeAccuracy(practiceText, tr.text);
      setPronunciationScore(score);
      if (score >= 85) {
        setPronunciationFeedback('Excellent articulation');
        updateStats({ xpPoints: (user.stats?.xpPoints || 0) + 8 });
      } else if (score >= 65) {
        setPronunciationFeedback('Good, tighten consonants and vowels');
      } else {
        setPronunciationFeedback('Practice the mouth shape and stress');
      }
    } else {
      setPronunciationScore(null);
      setPronunciationFeedback('Could not recognize speech');
    }
  }, [practiceText, speech, computeAccuracy, targetLang?.code, updateStats, user.stats?.xpPoints]);

  const buildQuiz = useCallback(() => {
    const items: QuizItem[] = [];
    const words = (data?.commonWords ?? []).slice(0, 20);
    const phrases = (data?.phrases ?? []).slice(0, 12);
    const numbers = (data?.numbers ?? []).slice(0, 15);
    const alphabet = (data?.alphabet ?? []).slice(0, 10);

    words.forEach(w => {
      const distractors = words.filter(v => v !== w).slice(0, 3).map(v => v.native);
      const choices = [...distractors, w.native].sort(() => Math.random() - 0.5);
      items.push({ prompt: w.target, correct: w.native, choices, kind: 'word' });
    });
    phrases.forEach(p => {
      const distractors = phrases.filter(v => v !== p).slice(0, 3).map(v => v.native);
      const choices = [...distractors, p.native].sort(() => Math.random() - 0.5);
      items.push({ prompt: p.target, correct: p.native, choices, kind: 'phrase' });
    });
    numbers.forEach(n => {
      const distractors = numbers.filter(v => v !== n).slice(0, 3).map(v => String(v.value));
      const choices = [...distractors, String(n.value)].sort(() => Math.random() - 0.5);
      items.push({ prompt: n.target, correct: String(n.value), choices, kind: 'number' });
    });
    alphabet.forEach(a => {
      const ex = a.examples?.[0];
      if (ex) {
        const pool = (data?.alphabet ?? []).filter(v => v !== a);
        const distractors = pool.slice(0, 3).map(v => v.examples?.[0]?.translation ?? v.character);
        const correct = ex.translation ?? a.character;
        const choices = [...distractors, correct].sort(() => Math.random() - 0.5);
        items.push({ prompt: `${a.character} · ${a.romanization ?? a.pronunciation}`, correct, choices, kind: 'alphabet' });
      }
    });

    const shuffled = items.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuiz(shuffled);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(false);
  }, [data]);

  const answerQuiz = useCallback((choice: string) => {
    if (!quiz[quizIndex]) return;
    if (quizAnswered) return;
    const isCorrect = choice === quiz[quizIndex].correct;
    setQuizAnswered(true);
    if (isCorrect) {
      setQuizScore(s => s + 1);
      updateStats({ xpPoints: (user.stats?.xpPoints || 0) + 5, wordsLearned: (user.stats?.wordsLearned || 0) + 1 });
    }
    setTimeout(() => {
      if (quizIndex < quiz.length - 1) {
        setQuizIndex(i => i + 1);
        setQuizAnswered(false);
      }
    }, 600);
  }, [quiz, quizIndex, quizAnswered, updateStats, user.stats?.xpPoints, user.stats?.wordsLearned]);

  const generateAiTips = useCallback(async () => {
    if (!targetLang || !nativeLang) return;
    try {
      setAiError(null);
      setAiLoading(true);
      setAiTips([]);
      const res = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a world-class language coach. Return 6 ultra-actionable tips only.' },
            { role: 'user', content: `Give advanced pronunciation, phonics and vocabulary acquisition tips for native ${nativeLang.name} learning ${targetLang.name}. Use short bullet points.` },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch AI tips');
      const json = await res.json() as { completion?: string };
      const raw = (json?.completion ?? '').toString();
      const lines = raw.split(/\n|\r/).map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean).slice(0, 8);
      setAiTips(lines);
    } catch (e) {
      console.error('[Learn] AI tips error', e);
      setAiError('Could not generate AI tips. Try again.');
    } finally {
      setAiLoading(false);
    }
  }, [targetLang, nativeLang]);

  if (!targetLang || !nativeLang) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <View style={styles.centerWrap}>
            <GraduationCap size={36} color="#6B7280" />
            <Text style={styles.infoText}>Select your languages in Settings to personalize your Learn page.</Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top }]}>        
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#34D399", "#10B981"]} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroKicker} testID="learn-kicker">{nativeLang.flag} → {targetLang.flag}</Text>
              <Text style={styles.heroTitle} testID="learn-title">Master {targetLang.name}</Text>
              <Text style={styles.heroSubtitle}>Alphabet, numbers, words, phrases, tips and a smart quiz — crafted for you.</Text>
            </View>
            <View style={styles.heroBadge}>
              <GraduationCap size={28} color="#065F46" />
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Flame size={16} color="#F97316" />
              <Text style={styles.heroStatLabel}>Streak</Text>
              <Text style={styles.heroStatValue}>{user.stats?.streakDays ?? 0}d</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Star size={16} color="#FBBF24" />
              <Text style={styles.heroStatLabel}>XP</Text>
              <Text style={styles.heroStatValue}>{user.stats?.xpPoints ?? 0}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Trophy size={16} color={currentLeague.color} />
              <Text style={styles.heroStatLabel}>{currentLeague.name}</Text>
              <Text style={styles.heroStatValue}>{xpToNextLeague > 0 ? `${xpToNextLeague} XP to ${nextLeague?.name ?? ''}` : 'Top tier'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.searchRow}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search words & phrases in ${targetLang.name} or ${nativeLang.name}`}
              style={styles.searchInput}
              placeholderTextColor="#6B7280"
              testID="learn-search"
            />
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Grid size={20} color="#10B981" />, 'Alphabet', `Full script with ${nativeLang.name} translations via examples`) }
          {learnQuery.isFetching && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#10B981" />
              <Text style={styles.loadingText}>Loading alphabet…</Text>
            </View>
          )}
          {!!error && (
            <TouchableOpacity onPress={fetchLearnData} style={styles.errorCard} testID="learn-retry">
              <RefreshCw size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.alphaControlsRow}>
            <TouchableOpacity style={[styles.toggleBtn, alphaMode === 'grid' ? styles.toggleActive : null]} onPress={() => setAlphaMode('grid')} testID="alpha-mode-grid">
              <Grid size={14} color="#065F46" />
              <Text style={styles.toggleText}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, alphaMode === 'list' ? styles.toggleActive : null]} onPress={() => setAlphaMode('list')} testID="alpha-mode-list">
              <Hash size={14} color="#065F46" />
              <Text style={styles.toggleText}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, alphaShowTranslation ? styles.toggleActive : null]} onPress={() => setAlphaShowTranslation(v => !v)} testID="alpha-toggle-translation">
              <Shuffle size={14} color="#065F46" />
              <Text style={styles.toggleText}>{alphaShowTranslation ? 'Hide' : 'Show'} Translations</Text>
            </TouchableOpacity>
          </View>

          {data?.alphabet && data.alphabet.length > 0 && (
            alphaMode === 'grid' ? (
              <View style={styles.alphabetGrid}>
                {data.alphabet.map((ch, idx) => (
                  <View key={`${ch.id || 'alpha'}_${idx}`} style={styles.alphabetCard} testID={`alpha-${idx}`}>
                    <Text style={styles.alphaChar}>{ch.character}</Text>
                    {!!ch.romanization && <Text style={styles.alphaRoma}>{ch.romanization}</Text>}
                    <Text style={styles.alphaPron}>{ch.pronunciation}</Text>
                    {alphaShowTranslation && (
                      <View style={styles.alphaExamples}>
                        {ch.examples?.slice(0, 2).map((ex, i) => (
                          <View key={`ex_${i}`} style={styles.exampleRow}>
                            <Text style={styles.exampleWord}>{ex.word}</Text>
                            <Text style={styles.exampleTrans}>{ex.translation}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity style={styles.soundBtn} onPress={() => onPlay(ch.character)} testID={`alpha-pronounce-${idx}`}>
                      <Volume2 size={16} color="#10B981" />
                      <Text style={styles.soundText}>Pronounce</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                {data.alphabet.map((ch, idx) => (
                  <View key={`${ch.id || 'alpha_list'}_${idx}`} style={styles.alphaListRow}>
                    <Text style={styles.alphaListChar}>{ch.character}</Text>
                    <View style={styles.flex1}>
                      {!!ch.romanization && <Text style={styles.alphaRoma}>{ch.romanization}</Text>}
                      <Text style={styles.alphaPron}>{ch.pronunciation}</Text>
                      {alphaShowTranslation && ch.examples?.[0] && (
                        <Text style={styles.alphaExampleInline}>{ch.examples[0].word} · {ch.examples[0].translation}</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.soundIcon} onPress={() => onPlay(ch.character)} testID={`alpha-play-${idx}`}>
                      <Play size={16} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )
          )}
        </View>

        <View style={styles.section}>
          {sectionHeader(<Hash size={20} color="#3B82F6" />, 'Numbers', `0–20 and tens up to 100 in ${targetLang.name}`)}
          {learnQuery.isFetching && !data && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.loadingText}>Loading numbers…</Text>
            </View>
          )}
          {data?.numbers && (
            <View>
              <View style={styles.numberRow}>
                {data.numbers.slice(0, 21).map((n, idx) => (
                  <TouchableOpacity key={`n_${n.value}_${idx}`} style={styles.numberPill} onPress={() => onPlay(n.target)} testID={`num-${n.value}`}>
                    <Text style={styles.numberValue}>{n.value}</Text>
                    <Text style={styles.numberTarget}>{n.target}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tensRow}>
                {data.numbers.filter(n => n.value % 10 === 0 && n.value >= 20).map((n, idx) => (
                  <TouchableOpacity key={`t_${n.value}_${idx}`} style={styles.tenCard} onPress={() => onPlay(n.target)} testID={`ten-${n.value}`}>
                    <Text style={styles.tenValue}>{n.value}</Text>
                    <Text style={styles.tenTarget}>{n.target}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {sectionHeader(<Target size={20} color="#0EA5E9" />, 'Flashcards', 'Swipe right if you know it, left to skip')}
          <View style={styles.flashWrap}>
            {cards.length > 0 && (
              <Animated.View
                style={[styles.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: pan.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-15deg', '0deg', '15deg'] }) }] }]}
                {...panResponder.panHandlers}
                testID="flashcard"
              >
                <Text style={styles.cardTarget}>{cards[cardIndex % cards.length]?.target}</Text>
                <Text style={styles.cardNative}>{cards[cardIndex % cards.length]?.native}</Text>
                {!!cards[cardIndex % cards.length]?.theme && (
                  <Text style={styles.cardTheme}>{cards[cardIndex % cards.length]?.theme}</Text>
                )}
              </Animated.View>
            )}
            <View style={styles.flashActions}>
              <TouchableOpacity onPress={() => swipe('left')} style={[styles.flashBtn, { backgroundColor: '#F3F4F6' }]} testID="flash-skip">
                <XCircle size={16} color="#111827" />
                <Text style={styles.flashBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => swipe('right')} style={[styles.flashBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]} testID="flash-know">
                <CheckCircle2 size={16} color="#047857" />
                <Text style={styles.flashBtnText}>Know it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<BookOpen size={20} color="#6366F1" />, 'Vocabulary & Pronunciation', fixingLang ? 'Translating vocabulary…' : 'Tap to hear words, then record and get feedback')}
          {Object.keys(groupedVocabulary).map((themeKey) => (
            <View key={`group_${themeKey}`} style={styles.groupWrap}>
              <Text style={styles.groupTitle}>{themeKey.toUpperCase()}</Text>
              <View style={styles.wordsGrid}>
                {groupedVocabulary[themeKey].slice(0, 8).map((w, i) => (
                  <TouchableOpacity key={`w_${themeKey}_${i}`} style={styles.wordCard} onPress={() => { setPracticeText(w.target); onPlay(w.target); }} testID={`vocab-${themeKey}-${i}`}>
                    <Text style={styles.wordTarget}>{w.target}</Text>
                    <Text style={styles.wordNative}>{w.native}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.pronounceCard}>
            <View style={styles.practicePicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.practiceChipsRow}>
                {practiceCandidates.slice(0, 12).map((t, i) => (
                  <TouchableOpacity key={`pt_${i}_${t}`} style={[styles.practiceChip, practiceText === t ? styles.practiceChipActive : null]} onPress={() => setPracticeText(t)} testID={`practice-chip-${i}`}>
                    <Text style={[styles.practiceChipText, practiceText === t ? styles.practiceChipTextActive : null]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.practiceNow}>
              <Text style={styles.practiceLabel}>{practiceText || 'Pick a word to practice'}</Text>
              <View style={styles.practiceControls}>
                {!speech.recordingState.isRecording ? (
                  <TouchableOpacity onPress={speech.startRecording} style={styles.micBtn} disabled={!practiceText} testID="pronounce-record">
                    <Mic size={18} color="#FFFFFF" />
                    <Text style={styles.micBtnText}>Record</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleTranscribeAndScore} style={[styles.micBtn, styles.stopBtn]} testID="pronounce-stop">
                    <Square size={18} color="#FFFFFF" />
                    <Text style={styles.micBtnText}>Stop</Text>
                  </TouchableOpacity>
                )}
                {!!speech.recordingState.uri && (
                  <TouchableOpacity onPress={speech.playRecording} style={styles.playRecBtn} testID="pronounce-play">
                    <PlayCircle size={18} color="#111827" />
                    <Text style={styles.playRecText}>Play</Text>
                  </TouchableOpacity>
                )}
              </View>
              {speech.isTranscribing && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#10B981" />
                  <Text style={styles.loadingText}>Analyzing…</Text>
                </View>
              )}
              {!!speech.transcriptionResult && (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptLabel}>Heard</Text>
                  <Text style={styles.transcriptText}>{speech.transcriptionResult.text}</Text>
                </View>
              )}
              {pronunciationScore !== null && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreValue}>{pronunciationScore}%</Text>
                  <Text style={styles.scoreFeedback}>{pronunciationFeedback}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Quote size={20} color="#8B5CF6" />, 'Common Phrases', 'Useful, polite, and travel-ready')}
          <View>
            {data?.phrases?.slice(0, 16).map((p, i) => (
              <View key={`p_${i}`} style={styles.phraseRow}>
                <View style={styles.phraseL}>
                  <Text style={styles.phraseTarget}>{p.target}</Text>
                  <Text style={styles.phraseNative}>{p.native}</Text>
                </View>
                <TouchableOpacity style={styles.soundIcon} onPress={() => onPlay(p.target)} testID={`phrase-play-${i}`}>
                  <Volume2 size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<BookOpen size={20} color="#0EA5E9" />, 'Grammar', `Core patterns optimized for ${nativeLang.name} → ${targetLang.name}`)}
          <View>
            {(data?.grammar ?? []).slice(0, 6).map((g, i) => (
              <View key={`g_${g.id}_${i}`} style={styles.grammarCard}>
                <Text style={styles.grammarTitle}>{g.title}</Text>
                <Text style={styles.grammarExplain}>{g.explanation}</Text>
                {g.examples.slice(0, 3).map((ex, j) => (
                  <View key={`gx_${j}`} style={styles.exampleRow}>
                    <Text style={styles.exampleWord}>{ex.target}</Text>
                    <Text style={styles.exampleTrans}>{ex.native}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Quote size={20} color="#10B981" />, 'Dialogue', 'Contextual conversations you can replay')}
          <View>
            {(data?.dialogues ?? []).slice(0, 3).map((d, i) => (
              <View key={`d_${d.id}_${i}`} style={styles.dialogueCard}>
                <Text style={styles.dialogueScene}>{d.scene}</Text>
                {d.turns.slice(0, 6).map((t, j) => (
                  <View key={`dt_${j}`} style={styles.dialogueTurn}>
                    <Text style={styles.dialogueSpeaker}>{t.speaker}</Text>
                    <View style={styles.dialogueTexts}>
                      <Text style={styles.dialogueTarget}>{t.target}</Text>
                      <Text style={styles.dialogueNative}>{t.native}</Text>
                    </View>
                    <TouchableOpacity style={styles.soundIcon} onPress={() => onPlay(t.target)} testID={`dialogue-play-${i}-${j}`}>
                      <Volume2 size={16} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Waves size={20} color="#F43F5E" />, 'Phonics', 'Sound-to-letter mapping with practice drills')}
          <View>
            {phonics.slice(0, 12).map((ph, i) => (
              <View key={`ph_${ph.id}_${i}`} style={styles.phonicsRow}>
                <View style={styles.phonicsL}>
                  <Text style={styles.phonicsSound}>{ph.sound} {ph.ipa ? `· ${ph.ipa}` : ''}</Text>
                  <Text style={styles.phonicsGraphemes}>{ph.graphemes.join(', ')}</Text>
                  {!!ph.mouthHint && <Text style={styles.mouthHint}>{ph.mouthHint}</Text>}
                </View>
                <View style={styles.phonicsR}>
                  {ph.examples.slice(0, 2).map((ex, j) => (
                    <TouchableOpacity key={`ex_${j}`} style={styles.phonicsExample} onPress={() => onPlay(ex.word)} testID={`phonics-ex-${i}-${j}`}>
                      <Text style={styles.exampleWord}>{ex.word}</Text>
                      <Text style={styles.exampleTrans}>{ex.translation}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <PhonicsTrainer items={phonics.slice(0, 8)} targetLangCode={targetLang.code} testIDPrefix="phonics-trainer" />
          </View>
        </View>


        <View style={styles.section}>
          {sectionHeader(<Lightbulb size={20} color="#FCD34D" />, 'AI Tips', `Advanced strategies for ${targetLang.name}`)}
          <View style={styles.tipsCard}>
            {(aiTips.length > 0 ? aiTips : data?.tips ?? []).map((tip, i) => (
              <View key={`tip_${i}`} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
            <View style={styles.aiTipsFooter}>
              {aiLoading ? (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator color="#F59E0B" />
                  <Text style={styles.aiLoadingText}>Generating advanced tips…</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={generateAiTips} style={styles.aiBtn} testID="generate-ai-tips">
                  <Sparkles size={16} color="#7C2D12" />
                  <Text style={styles.aiBtnText}>Generate advanced AI tips</Text>
                </TouchableOpacity>
              )}
              {!!aiError && <Text style={styles.aiError}>{aiError}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Target size={20} color="#10B981" />, 'Quick Quiz', 'Answer and earn XP')}
          <View style={styles.quizCard}>
            {quiz.length === 0 ? (
              <TouchableOpacity onPress={buildQuiz} style={styles.quizStartBtn} testID="quiz-start">
                <Text style={styles.quizStartText}>Start 10-question quiz</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.quizProgress}>{quizIndex + 1} / {quiz.length}</Text>
                <Text style={styles.quizPrompt}>{quiz[quizIndex]?.prompt}</Text>
                <View style={styles.quizChoices}>
                  {quiz[quizIndex]?.choices.map((c, i) => {
                    const isCorrect = quiz[quizIndex]?.correct === c;
                    return (
                      <TouchableOpacity
                        key={`choice_${i}`}
                        style={[
                          styles.choiceBtn,
                          quizAnswered && (isCorrect ? styles.choiceCorrect : styles.choiceNeutral),
                        ]}
                        onPress={() => answerQuiz(c)}
                        disabled={quizAnswered}
                        testID={`quiz-choice-${i}`}
                      >
                        <Text style={styles.choiceText}>{c}</Text>
                        {quizAnswered && isCorrect && <CheckCircle2 size={16} color="#047857" />}
                        {quizAnswered && !isCorrect && <XCircle size={16} color="#9CA3AF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.quizFooter}>
                  <Text style={styles.quizScore}>Score: {quizScore}</Text>
                  {quizIndex === quiz.length - 1 && quizAnswered && (
                    <TouchableOpacity onPress={buildQuiz} style={styles.quizRestart} testID="quiz-restart">
                      <RefreshCw size={14} color="#111827" />
                      <Text style={styles.quizRestartText}>Restart</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<ShieldCheck size={20} color="#0EA5E9" />, 'Your Progress', 'Achievements & rank')}
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, progressWidthStyle]} />
              </View>
              <Text style={styles.progressLabel}>{Math.min(100, achievementProgress).toFixed(0)}% achievements</Text>
            </View>
            <View style={styles.badgesRow}>
              {unlockedAchievements.slice(0, 6).map((a, i) => (
                <View key={`ach_${i}`} style={styles.badgePill}>
                  <Text style={styles.badgeIcon}>{a.icon}</Text>
                  <Text style={styles.badgeText}>{a.name}</Text>
                </View>
              ))}
            </View>
            <View style={styles.rankRow}>
              <Trophy size={16} color={currentLeague.color} />
              <Text style={styles.rankText}>Rank #{userRank} in your league · {leaderboard.length} learners</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={fetchLearnData} style={styles.refreshCta} testID="refresh-learn">
          <RefreshCw size={16} color="#111827" />
          <Text style={styles.refreshText}>Refresh content</Text>
          <ChevronRight size={16} color="#111827" />
        </TouchableOpacity>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollPad: { paddingBottom: 32 },
  hero: { margin: 16, borderRadius: 16, padding: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroKicker: { color: 'white', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  heroTitle: { color: 'white', fontSize: 26, fontWeight: '800', marginTop: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, lineHeight: 20 },
  heroBadge: { backgroundColor: 'white', width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroStatsRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  heroStatCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  heroStatLabel: { color: 'white', fontSize: 10, marginTop: 6 },
  heroStatValue: { color: 'white', fontSize: 12, fontWeight: '800' },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginLeft: 8 },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  searchRow: { marginBottom: 4 },
  searchInput: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 12, color: '#6B7280', marginLeft: 8 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 10, borderRadius: 12 },
  errorText: { color: '#991B1B', fontSize: 12, marginLeft: 6, flex: 1 },

  alphabetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  alphabetCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  alphaChar: { fontSize: 40, fontWeight: '800', color: '#047857' },
  alphaRoma: { fontSize: 12, color: '#059669', marginTop: 2 },
  alphaPron: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  alphaExamples: { marginTop: 8 },
  exampleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  exampleWord: { fontSize: 12, fontWeight: '700', color: '#111827' },
  exampleTrans: { fontSize: 12, color: '#6B7280' },
  soundBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  soundText: { marginLeft: 6, fontSize: 12, color: '#047857', fontWeight: '700' },

  numberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numberPill: { backgroundColor: 'white', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  numberValue: { fontSize: 12, color: '#6B7280', marginRight: 6 },
  numberTarget: { fontSize: 14, color: '#111827', fontWeight: '700' },
  tensRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tenCard: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  tenValue: { fontSize: 12, color: '#3730A3', fontWeight: '700' },
  tenTarget: { fontSize: 14, color: '#312E81', fontWeight: '700' },

  wordsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  wordCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  wordTarget: { fontSize: 16, color: '#111827', fontWeight: '700' },
  wordNative: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  wordTheme: { marginTop: 6, fontSize: 10, color: '#3B82F6', fontWeight: '700' },
  groupTitle: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginBottom: 6, marginLeft: 2 },
  groupWrap: { marginBottom: 8 },
  flex1: { flex: 1 },

  phraseRow: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phraseL: { flex: 1, paddingRight: 12 },
  phraseTarget: { fontSize: 16, color: '#111827', fontWeight: '700' },
  phraseNative: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  soundIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' },

  phonicsRow: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  phonicsL: { flex: 1, paddingRight: 10 },
  phonicsR: { flexDirection: 'row', gap: 8 },
  phonicsSound: { fontSize: 16, fontWeight: '800', color: '#111827' },
  phonicsGraphemes: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mouthHint: { marginTop: 6, fontSize: 12, color: '#EF4444' },
  phonicsExample: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },

  grammarCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  grammarTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  grammarExplain: { fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 6 },

  dialogueCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10 },
  dialogueScene: { fontSize: 14, color: '#111827', fontWeight: '800', marginBottom: 6 },
  dialogueTurn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  dialogueSpeaker: { width: 64, color: '#6B7280', fontSize: 12, fontWeight: '700' },
  dialogueTexts: { flex: 1, paddingRight: 8 },
  dialogueTarget: { color: '#111827', fontWeight: '700' },
  dialogueNative: { color: '#6B7280', marginTop: 2, fontSize: 12 },

  tipsCard: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 8 },
  tipText: { fontSize: 13, color: '#374151', flex: 1 },
  aiTipsFooter: { marginTop: 8 },
  aiBtn: { alignSelf: 'flex-start', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBtnText: { color: '#7C2D12', fontWeight: '800', fontSize: 12 },
  aiError: { marginTop: 6, color: '#991B1B', fontSize: 12 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { color: '#92400E', fontSize: 12 },

  pronounceCard: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  practicePicker: { marginBottom: 8 },
  practiceChipsRow: { gap: 8 },
  practiceChip: { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 },
  practiceChipActive: { backgroundColor: '#DCFCE7' },
  practiceChipText: { color: '#111827', fontSize: 12, fontWeight: '700' },
  practiceChipTextActive: { color: '#065F46' },
  practiceNow: { },
  practiceLabel: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  practiceControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  micBtn: { backgroundColor: '#10B981', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stopBtn: { backgroundColor: '#EF4444' },
  micBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },
  playRecBtn: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 6 },
  playRecText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  transcriptBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  transcriptLabel: { fontSize: 10, color: '#6B7280', marginBottom: 4 },
  transcriptText: { fontSize: 14, color: '#111827' },
  scoreRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  scoreFeedback: { fontSize: 12, color: '#374151' },

  quizCard: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  quizStartBtn: { backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  quizStartText: { color: '#065F46', fontWeight: '800' },
  quizProgress: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  quizPrompt: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  quizChoices: { gap: 8 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  choiceText: { color: '#111827', fontSize: 14, fontWeight: '600' },
  choiceCorrect: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0' },
  choiceNeutral: { backgroundColor: '#F9FAFB' },
  quizFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizScore: { color: '#111827', fontWeight: '800' },
  quizRestart: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  quizRestartText: { color: '#111827', fontWeight: '700', fontSize: 12 },

  progressWrap: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarOuter: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 999 },
  progressBarInner: { height: 8, backgroundColor: '#10B981', borderRadius: 999 },
  progressLabel: { marginLeft: 8, fontSize: 12, color: '#6B7280' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeIcon: { fontSize: 14, color: '#111827' },
  badgeText: { fontSize: 12, color: '#111827', fontWeight: '700' },
  rankRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankText: { color: '#374151', fontSize: 12 },

  refreshCta: { alignSelf: 'center', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  refreshText: { fontSize: 12, color: '#111827', fontWeight: '700' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  infoText: { marginTop: 12, fontSize: 14, color: '#6B7280', textAlign: 'center' },

  alphaControlsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  toggleActive: { backgroundColor: '#A7F3D0' },
  toggleText: { color: '#065F46', fontWeight: '700', fontSize: 12 },
  alphaListRow: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  alphaListChar: { fontSize: 28, fontWeight: '800', color: '#047857', width: 36, textAlign: 'center' },
  alphaExampleInline: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  flashWrap: { backgroundColor: 'transparent', alignItems: 'center' },
  card: { width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  cardTarget: { fontSize: 24, fontWeight: '800', color: '#111827' },
  cardNative: { marginTop: 6, fontSize: 14, color: '#6B7280' },
  cardTheme: { marginTop: 6, fontSize: 10, color: '#3B82F6', fontWeight: '700' },
  flashActions: { flexDirection: 'row', gap: 10, marginTop: 12, alignSelf: 'stretch', justifyContent: 'space-between' },
  flashBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  flashBtnText: { fontWeight: '700', color: '#111827' },
});

function buildFallbackContent(nativeName: string, targetName: string): LearnPayload {
  const alphaBase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphabet: AlphabetEntry[] = alphaBase.map((ch, i) => ({
    id: `latin_${i}`,
    character: ch,
    romanization: undefined,
    pronunciation: ch,
    type: 'special',
    examples: [
      { word: `${ch.toLowerCase()}a`, translation: `${ch.toLowerCase()}a (${nativeName})` },
      { word: `${ch.toLowerCase()}o`, translation: `${ch.toLowerCase()}o (${nativeName})` },
    ],
    difficulty: 1,
  }));

  const presets: Record<string, { numbers: { value: number; target: string; pronunciation?: string }[]; commonWords: { target: string; native: string; pronunciation?: string; theme: string }[]; phrases: { target: string; native: string; pronunciation?: string; context: string }[]; tips: string[]; phonics?: PhonicsEntry[]; grammar?: GrammarEntry[]; dialogues?: DialogueEntry[]; }> = {
    Spanish: {
      numbers: [
        { value: 0, target: 'cero' }, { value: 1, target: 'uno' }, { value: 2, target: 'dos' }, { value: 3, target: 'tres' }, { value: 4, target: 'cuatro' },
        { value: 5, target: 'cinco' }, { value: 6, target: 'seis' }, { value: 7, target: 'siete' }, { value: 8, target: 'ocho' }, { value: 9, target: 'nueve' },
        { value: 10, target: 'diez' }, { value: 11, target: 'once' }, { value: 12, target: 'doce' }, { value: 13, target: 'trece' }, { value: 14, target: 'catorce' },
        { value: 15, target: 'quince' }, { value: 16, target: 'dieciséis' }, { value: 17, target: 'diecisiete' }, { value: 18, target: 'dieciocho' }, { value: 19, target: 'diecinueve' },
        { value: 20, target: 'veinte' }, { value: 30, target: 'treinta' }, { value: 40, target: 'cuarenta' }, { value: 50, target: 'cincuenta' }, { value: 60, target: 'sesenta' },
        { value: 70, target: 'setenta' }, { value: 80, target: 'ochenta' }, { value: 90, target: 'noventa' }, { value: 100, target: 'cien' },
      ],
      commonWords: [
        { target: 'hola', native: 'hello', theme: 'people' },
        { target: 'gracias', native: 'thank you', theme: 'people' },
        { target: 'por favor', native: 'please', theme: 'people' },
        { target: 'sí', native: 'yes', theme: 'people' },
        { target: 'no', native: 'no', theme: 'people' },
        { target: 'amigo', native: 'friend', theme: 'people' },
        { target: 'familia', native: 'family', theme: 'people' },
        { target: 'hoy', native: 'today', theme: 'time' },
        { target: 'mañana', native: 'tomorrow', theme: 'time' },
        { target: 'ayer', native: 'yesterday', theme: 'time' },
        { target: 'ciudad', native: 'city', theme: 'places' },
        { target: 'casa', native: 'house', theme: 'places' },
        { target: 'escuela', native: 'school', theme: 'places' },
        { target: 'agua', native: 'water', theme: 'food' },
        { target: 'pan', native: 'bread', theme: 'food' },
        { target: 'café', native: 'coffee', theme: 'food' },
        { target: 'tren', native: 'train', theme: 'travel' },
        { target: 'aeropuerto', native: 'airport', theme: 'travel' },
        { target: 'billete', native: 'ticket', theme: 'travel' },
        { target: 'baño', native: 'bathroom', theme: 'places' },
      ],
      phrases: [
        { target: '¿Cómo estás?', native: 'How are you?', context: 'general' },
        { target: 'Mucho gusto', native: 'Nice to meet you', context: 'general' },
        { target: '¿Dónde está el baño?', native: 'Where is the bathroom?', context: 'travel' },
        { target: '¿Cuánto cuesta?', native: 'How much is it?', context: 'shopping' },
        { target: 'No entiendo', native: "I don't understand", context: 'learning' },
        { target: '¿Hablas inglés?', native: 'Do you speak English?', context: 'travel' },
        { target: 'Quisiera esto, por favor', native: 'I would like this, please', context: 'restaurant' },
        { target: 'Perdón', native: 'Excuse me / Sorry', context: 'polite' },
        { target: 'Buenos días', native: 'Good morning', context: 'greeting' },
        { target: 'Buenas noches', native: 'Good night', context: 'greeting' },
        { target: '¿Puedes ayudarme?', native: 'Can you help me?', context: 'help' },
        { target: 'Estoy aprendiendo español', native: 'I am learning Spanish', context: 'learning' },
      ],
      tips: [
        'Vocales siempre claras: a e i o u',
        'La r simple vs. rr fuerte: practica vibración',
        'Sílaba tónica marcada; evita diptongos en exceso',
        'C y z antes de e/i con ceceo (ES) o seseo (AL)',
        'Usa por/para correctamente; fíjate en contexto',
        'Género y número concuerdan: el/la; -o/-a',
        'Pronombres clíticos: lo, la, le con verbos',
        'Practica chunks: “¿Puedo tener…?”, “Quisiera…”',
      ],
      grammar: [
        {
          id: 'es_g_gender',
          title: 'Noun Gender & Agreement',
          explanation: 'Most nouns are masculine (-o) or feminine (-a). Articles and adjectives agree: el gato negro / la casa blanca.',
          examples: [
            { target: 'el perro grande', native: 'the big dog' },
            { target: 'la mesa pequeña', native: 'the small table' },
          ],
        },
        {
          id: 'es_g_ser_estar',
          title: 'Ser vs. Estar',
          explanation: 'Ser for identity/time/origin; Estar for states/location.',
          examples: [
            { target: 'Soy estudiante', native: 'I am a student' },
            { target: 'Estoy cansado', native: 'I am tired' },
          ],
        },
      ],
      dialogues: [
        {
          id: 'es_d_cafe',
          scene: 'En la cafetería',
          turns: [
            { speaker: 'A', target: 'Hola, ¿qué deseas?', native: 'Hi, what would you like?' },
            { speaker: 'B', target: 'Un café con leche, por favor.', native: 'A latte, please.' },
            { speaker: 'A', target: '¿Algo más?', native: 'Anything else?' },
            { speaker: 'B', target: 'No, gracias.', native: 'No, thank you.' },
          ],
        },
      ],
      phonics: [
        {
          id: 'es_v_a',
          sound: 'a',
          ipa: '/a/',
          graphemes: ['a'],
          examples: [
            { word: 'casa', translation: 'house' },
            { word: 'agua', translation: 'water' },
          ],
          mouthHint: 'Boca abierta, mandíbula relajada; lengua baja y adelantada.',
        },
        {
          id: 'es_v_e',
          sound: 'e',
          ipa: '/e/',
          graphemes: ['e'],
          examples: [
            { word: 'mesa', translation: 'table' },
            { word: 'verde', translation: 'green' },
          ],
          mouthHint: 'Sonido medio-frontal; sonríe ligeramente para clarificar.',
        },
        {
          id: 'es_v_i',
          sound: 'i',
          ipa: '/i/',
          graphemes: ['i'],
          examples: [
            { word: 'vino', translation: 'wine' },
            { word: 'familia', translation: 'family' },
          ],
          mouthHint: 'Labios estirados; lengua alta y adelantada.',
        },
        {
          id: 'es_v_o',
          sound: 'o',
          ipa: '/o/',
          graphemes: ['o'],
          examples: [
            { word: 'sol', translation: 'sun' },
            { word: 'corto', translation: 'short' },
          ],
          mouthHint: 'Redondea suavemente los labios; sonido medio-posterior.',
        },
        {
          id: 'es_v_u',
          sound: 'u',
          ipa: '/u/',
          graphemes: ['u'],
          examples: [
            { word: 'luna', translation: 'moon' },
            { word: 'uno', translation: 'one' },
          ],
          mouthHint: 'Labios redondeados; lengua alta y posterior.',
        },
        {
          id: 'es_c_rr',
          sound: 'rr',
          ipa: '/r̄/ ~ /rː/',
          graphemes: ['rr', 'r (inicio)'],
          examples: [
            { word: 'perro', translation: 'dog' },
            { word: 'rojo', translation: 'red' },
          ],
          mouthHint: 'Vibración múltiple de la punta de la lengua contra los alveolos.',
        },
        {
          id: 'es_c_j',
          sound: 'j',
          ipa: '/x/',
          graphemes: ['j', 'g+e/i'],
          examples: [
            { word: 'jamón', translation: 'ham' },
            { word: 'gente', translation: 'people' },
          ],
          mouthHint: 'Fricativa velar; aire áspero por la parte posterior de la boca.',
        },
        {
          id: 'es_c_ll',
          sound: 'll',
          ipa: '/ʎ/ ~ /ʝ/ (yeísmo)',
          graphemes: ['ll'],
          examples: [
            { word: 'llave', translation: 'key' },
            { word: 'lluvia', translation: 'rain' },
          ],
          mouthHint: 'Aproximante palatal; coloca la lengua alta, cerca del paladar duro.',
        },
      ],
    },
    French: {
      numbers: [
        { value: 0, target: 'zéro' }, { value: 1, target: 'un' }, { value: 2, target: 'deux' }, { value: 3, target: 'trois' }, { value: 4, target: 'quatre' },
        { value: 5, target: 'cinq' }, { value: 6, target: 'six' }, { value: 7, target: 'sept' }, { value: 8, target: 'huit' }, { value: 9, target: 'neuf' },
        { value: 10, target: 'dix' }, { value: 11, target: 'onze' }, { value: 12, target: 'douze' }, { value: 13, target: 'treize' }, { value: 14, target: 'quatorze' },
        { value: 15, target: 'quinze' }, { value: 16, target: 'seize' }, { value: 17, target: 'dix-sept' }, { value: 18, target: 'dix-huit' }, { value: 19, target: 'dix-neuf' },
        { value: 20, target: 'vingt' }, { value: 30, target: 'trente' }, { value: 40, target: 'quarante' }, { value: 50, target: 'cinquante' }, { value: 60, target: 'soixante' },
        { value: 70, target: 'soixante-dix' }, { value: 80, target: 'quatre-vingts' }, { value: 90, target: 'quatre-vingt-dix' }, { value: 100, target: 'cent' },
      ],
      commonWords: [
        { target: 'bonjour', native: 'hello', theme: 'people' },
        { target: 'merci', native: 'thank you', theme: 'people' },
        { target: 's’il vous plaît', native: 'please', theme: 'people' },
        { target: 'oui', native: 'yes', theme: 'people' },
        { target: 'non', native: 'no', theme: 'people' },
        { target: 'ami', native: 'friend', theme: 'people' },
        { target: 'famille', native: 'family', theme: 'people' },
        { target: 'aujourd’hui', native: 'today', theme: 'time' },
        { target: 'demain', native: 'tomorrow', theme: 'time' },
        { target: 'hier', native: 'yesterday', theme: 'time' },
        { target: 'ville', native: 'city', theme: 'places' },
        { target: 'maison', native: 'house', theme: 'places' },
        { target: 'école', native: 'school', theme: 'places' },
        { target: 'eau', native: 'water', theme: 'food' },
        { target: 'pain', native: 'bread', theme: 'food' },
        { target: 'café', native: 'coffee', theme: 'food' },
        { target: 'train', native: 'train', theme: 'travel' },
        { target: 'aéroport', native: 'airport', theme: 'travel' },
        { target: 'billet', native: 'ticket', theme: 'travel' },
        { target: 'toilettes', native: 'bathroom', theme: 'places' },
      ],
      phrases: [
        { target: 'Comment ça va ?', native: 'How are you?', context: 'general' },
        { target: 'Enchanté(e)', native: 'Nice to meet you', context: 'general' },
        { target: 'Où sont les toilettes ?', native: 'Where is the bathroom?', context: 'travel' },
        { target: 'Ça coûte combien ?', native: 'How much is it?', context: 'shopping' },
        { target: "Je ne comprends pas", native: "I don't understand", context: 'learning' },
        { target: 'Parlez-vous anglais ?', native: 'Do you speak English?', context: 'travel' },
        { target: "Je voudrais ceci, s’il vous plaît", native: 'I would like this, please', context: 'restaurant' },
        { target: 'Pardon', native: 'Excuse me / Sorry', context: 'polite' },
        { target: 'Bonjour', native: 'Good morning', context: 'greeting' },
        { target: 'Bonne nuit', native: 'Good night', context: 'greeting' },
        { target: 'Pouvez-vous m’aider ?', native: 'Can you help me?', context: 'help' },
        { target: 'J’apprends le français', native: 'I am learning French', context: 'learning' },
      ],
      tips: [
        'Voyelles nasales: on, an, in — pratique lente',
        'Liaison: relie mots pour fluidité (les_amis)',
        'R antérieure: gorge légère, pas roulée',
        'E muet souvent chuté en fin de mot',
        'Genres: le/la; accords au pluriel',
        'Tu/vous: politesse selon contexte',
        'Groupes: ou= /u/, eu= /ø/ ~ /œ/',
        'Imite prosodie de locuteurs natifs',
      ],
      grammar: [
        {
          id: 'fr_g_articles',
          title: 'Articles & Gender',
          explanation: 'Le (m), la (f), les (pl). L’ before vowel sound. Adjectives agree with the noun.',
          examples: [
            { target: 'le petit chien', native: 'the small dog (masc.)' },
            { target: 'la grande maison', native: 'the big house (fem.)' },
          ],
        },
        {
          id: 'fr_g_negation',
          title: 'Negation: ne ... pas',
          explanation: 'Wrap the verb with ne ... pas. In speech, “ne” may drop: Je (ne) parle pas.',
          examples: [
            { target: "Je ne comprends pas", native: "I don't understand" },
            { target: 'Il ne vient pas', native: 'He is not coming' },
          ],
        },
      ],
      dialogues: [
        {
          id: 'fr_d_hotel',
          scene: 'À la réception de l’hôtel',
          turns: [
            { speaker: 'A', target: 'Bonjour, vous avez une réservation ?', native: 'Hello, do you have a reservation?' },
            { speaker: 'B', target: 'Oui, au nom de Martin.', native: 'Yes, under the name Martin.' },
            { speaker: 'A', target: 'Très bien, voici la clé.', native: 'Very well, here is the key.' },
          ],
        },
      ],
      phonics: [
        {
          id: 'fr_v_on',
          sound: 'on',
          ipa: '/ɔ̃/',
          graphemes: ['on', 'om'],
          examples: [
            { word: 'bonjour', translation: 'hello' },
            { word: 'nom', translation: 'name' },
          ],
          mouthHint: 'Voyelle nasale: baissez le voile du palais; ne prononcez pas la consonne n/m finale.',
        },
        {
          id: 'fr_v_an',
          sound: 'an',
          ipa: '/ɑ̃/',
          graphemes: ['an', 'am', 'en (devant m/n)'],
          examples: [
            { word: 'enfant', translation: 'child' },
            { word: 'temps', translation: 'time' },
          ],
          mouthHint: 'Ouvrez la bouche; laissez passer l’air par le nez légèrement.',
        },
        {
          id: 'fr_v_in',
          sound: 'in',
          ipa: '/ɛ̃/',
          graphemes: ['in', 'im', 'ain', 'ein'],
          examples: [
            { word: 'vin', translation: 'wine' },
            { word: 'pain', translation: 'bread' },
          ],
          mouthHint: 'Voyelle nasale antérieure; lèvres peu arrondies.',
        },
        {
          id: 'fr_v_u',
          sound: 'u',
          ipa: '/y/',
          graphemes: ['u'],
          examples: [
            { word: 'lune', translation: 'moon' },
            { word: 'tu', translation: 'you (singular)' },
          ],
          mouthHint: 'Arrondissez fort les lèvres tout en gardant la langue en position de /i/.',
        },
        {
          id: 'fr_g_graphemes',
          sound: 'eu/œu',
          ipa: '/ø/ ~ /œ/',
          graphemes: ['eu', 'œu'],
          examples: [
            { word: 'peur', translation: 'fear' },
            { word: 'feu', translation: 'fire' },
          ],
          mouthHint: 'Position intermediaire; jouez sur l’ouverture pour /ø/ vs /œ/.',
        },
        {
          id: 'fr_c_r',
          sound: 'r',
          ipa: '/ʁ/',
          graphemes: ['r'],
          examples: [
            { word: 'rouge', translation: 'red' },
            { word: 'Paris', translation: 'Paris' },
          ],
          mouthHint: 'Fricative uvulaire légère; évitez de rouler.',
        },
      ],
    },
  };

  const preset = presets[targetName as keyof typeof presets];

  const numbers = preset?.numbers ?? (
    Array.from({ length: 21 }, (_, v) => ({ value: v, target: String(v), pronunciation: String(v) }))
      .concat([20,30,40,50,60,70,80,90,100].map(v => ({ value: v, target: String(v), pronunciation: String(v) })))
  );

  const commonWords = preset?.commonWords ?? [
    { target: 'hello', native: 'hello', theme: 'people' },
    { target: 'please', native: 'please', theme: 'people' },
    { target: 'thank you', native: 'thank you', theme: 'people' },
    { target: 'yes', native: 'yes', theme: 'people' },
    { target: 'no', native: 'no', theme: 'people' },
    { target: 'family', native: 'family', theme: 'people' },
    { target: 'friend', native: 'friend', theme: 'people' },
    { target: 'today', native: 'today', theme: 'time' },
    { target: 'tomorrow', native: 'tomorrow', theme: 'time' },
    { target: 'yesterday', native: 'yesterday', theme: 'time' },
    { target: 'house', native: 'house', theme: 'places' },
    { target: 'city', native: 'city', theme: 'places' },
    { target: 'school', native: 'school', theme: 'places' },
    { target: 'water', native: 'water', theme: 'food' },
    { target: 'bread', native: 'bread', theme: 'food' },
    { target: 'coffee', native: 'coffee', theme: 'food' },
    { target: 'train', native: 'train', theme: 'travel' },
    { target: 'airport', native: 'airport', theme: 'travel' },
    { target: 'ticket', native: 'ticket', theme: 'travel' },
    { target: 'bathroom', native: 'bathroom', theme: 'places' },
  ];

  const phrases = preset?.phrases ?? [
    { target: 'How are you?', native: 'How are you?', context: 'general' },
    { target: 'Nice to meet you', native: 'Nice to meet you', context: 'general' },
    { target: 'Where is the bathroom?', native: 'Where is the bathroom?', context: 'travel' },
    { target: 'How much is it?', native: 'How much is it?', context: 'shopping' },
    { target: "I don't understand", native: "I don't understand", context: 'learning' },
    { target: 'Do you speak English?', native: 'Do you speak English?', context: 'travel' },
    { target: 'I would like this, please', native: 'I would like this, please', context: 'restaurant' },
    { target: 'Excuse me', native: 'Excuse me', context: 'polite' },
    { target: 'Good morning', native: 'Good morning', context: 'greeting' },
    { target: 'Good night', native: 'Good night', context: 'greeting' },
    { target: 'Can you help me?', native: 'Can you help me?', context: 'help' },
    { target: 'I am learning', native: 'I am learning', context: 'learning' },
  ];

  const tips = (preset?.tips ?? [
    'Practice daily for short bursts',
    `Focus on sounds that don’t exist in ${nativeName}`,
    'Learn numbers and greetings first',
    'Repeat out loud to improve memory',
    'Use flashcards and quick quizzes',
    'Associate new words with images',
    'Review mistakes immediately',
    'Celebrate small wins to keep streaks',
  ]);

  const phonics = preset?.phonics ?? [
    { id: 'en_sh', sound: 'sh', ipa: '/ʃ/', graphemes: ['sh'], examples: [ { word: 'ship', translation: 'ship' }, { word: 'shoe', translation: 'shoe' } ], mouthHint: 'Round lips slightly; tongue close to palate with steady airflow.' },
    { id: 'en_th_voiceless', sound: 'th', ipa: '/θ/', graphemes: ['th'], examples: [ { word: 'think', translation: 'think' }, { word: 'thumb', translation: 'thumb' } ], mouthHint: 'Place tongue lightly between teeth; push air without voice.' },
    { id: 'en_th_voiced', sound: 'th', ipa: '/ð/', graphemes: ['th'], examples: [ { word: 'this', translation: 'this' }, { word: 'mother', translation: 'mother' } ], mouthHint: 'Same as /θ/ but vibrate vocal cords.' },
  ];

  const grammar = preset?.grammar ?? [
    { id: 'base_word_order', title: 'Basic Word Order', explanation: `${targetName}: Subject–Verb–Object in simple sentences.`, examples: [ { target: 'I eat apples', native: 'I eat apples' } ] },
  ];

  const dialogues = preset?.dialogues ?? [
    { id: 'base_greet', scene: 'Greeting', turns: [ { speaker: 'A', target: 'Hello!', native: 'Hello!' }, { speaker: 'B', target: 'Hi, how are you?', native: 'Hi, how are you?' } ] },
  ];

  return { alphabet, numbers, commonWords, phrases, tips, phonics, grammar, dialogues };
}
