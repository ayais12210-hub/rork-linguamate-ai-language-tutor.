import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, TextInput, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GraduationCap, Volume2, RefreshCw, ChevronRight, Lightbulb, Sparkles, Grid, Hash, Quote, Trophy, Target, ShieldCheck, Flame, Star, CheckCircle2, XCircle, Shuffle, Play, BookOpen, Waves } from 'lucide-react-native';
import { trpcClient } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useGamification } from '@/hooks/use-gamification';

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

interface LearnPayload {
  alphabet: AlphabetEntry[];
  numbers: { value: number; target: string; pronunciation?: string }[];
  commonWords: { target: string; native: string; pronunciation?: string; theme: string }[];
  phrases: { target: string; native: string; pronunciation?: string; context: string }[];
  tips: string[];
  phonics?: PhonicsEntry[];
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
          {sectionHeader(<Grid size={20} color="#10B981" />, 'Alphabet', `Full script with native translations via examples`)}
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
                  <View key={ch.id || `alpha_${idx}`} style={styles.alphabetCard} testID={`alpha-${idx}`}>
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
                  <View key={ch.id || `alpha_list_${idx}`} style={styles.alphaListRow}>
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
                {data.numbers.slice(0, 21).map((n) => (
                  <TouchableOpacity key={`n_${n.value}`} style={styles.numberPill} onPress={() => onPlay(n.target)} testID={`num-${n.value}`}>
                    <Text style={styles.numberValue}>{n.value}</Text>
                    <Text style={styles.numberTarget}>{n.target}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tensRow}>
                {data.numbers.filter(n => n.value % 10 === 0 && n.value >= 20).map((n) => (
                  <TouchableOpacity key={`t_${n.value}`} style={styles.tenCard} onPress={() => onPlay(n.target)} testID={`ten-${n.value}`}>
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
          {sectionHeader(<BookOpen size={20} color="#6366F1" />, 'Vocabulary', 'Organized by theme with quick pronounce')}
          {Object.keys(groupedVocabulary).map((themeKey) => (
            <View key={`group_${themeKey}`} style={styles.groupWrap}>
              <Text style={styles.groupTitle}>{themeKey.toUpperCase()}</Text>
              <View style={styles.wordsGrid}>
                {groupedVocabulary[themeKey].slice(0, 8).map((w, i) => (
                  <TouchableOpacity key={`w_${themeKey}_${i}`} style={styles.wordCard} onPress={() => onPlay(w.target)} testID={`vocab-${themeKey}-${i}`}>
                    <Text style={styles.wordTarget}>{w.target}</Text>
                    <Text style={styles.wordNative}>{w.native}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
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
          {sectionHeader(<Waves size={20} color="#F43F5E" />, 'Phonics', 'Sound-to-letter mapping with examples')}
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
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Lightbulb size={20} color="#FCD34D" />, 'Pronunciation & AI Tips', `Personalized strategies for ${targetLang.name}`)}
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
  const numbers = Array.from({ length: 21 }, (_, v) => ({ value: v, target: String(v), pronunciation: String(v) }))
    .concat([20,30,40,50,60,70,80,90,100].map(v => ({ value: v, target: String(v), pronunciation: String(v) })));
  const themes = ['people','time','places','food','travel'];
  const commonWords = Array.from({ length: 20 }, (_, i) => ({ target: `${targetName} word ${i+1}`, native: `${nativeName} word ${i+1}`, pronunciation: undefined, theme: themes[i % themes.length] }));
  const phrases = Array.from({ length: 12 }, (_, i) => ({ target: `${targetName} phrase ${i+1}`, native: `${nativeName} phrase ${i+1}`, pronunciation: undefined, context: 'general' }));
  const tips = [
    `Practice daily for short bursts`,
    `Focus on sounds that don’t exist in ${nativeName}`,
    `Learn numbers and greetings first`,
    `Repeat out loud to improve memory`,
    `Use flashcards and quick quizzes`,
    `Associate new words with images`,
    `Review mistakes immediately`,
    `Celebrate small wins to keep streaks`,
  ];
  return { alphabet, numbers, commonWords, phrases, tips };
}
