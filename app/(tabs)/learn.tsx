import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GraduationCap, Volume2, RefreshCw, ChevronRight, Lightbulb, Sparkles, Grid, Hash, Quote } from 'lucide-react-native';

interface AlphabetEntry {
  id: string;
  character: string;
  romanization?: string;
  pronunciation: string;
  type: 'vowel' | 'consonant' | 'special';
  examples: Array<{ word: string; translation: string; pronunciation?: string }>;
  difficulty: number;
}

interface LearnPayload {
  alphabet: AlphabetEntry[];
  numbers: Array<{ value: number; target: string; pronunciation?: string }>;
  commonWords: Array<{ target: string; native: string; pronunciation?: string; theme: string }>;
  phrases: Array<{ target: string; native: string; pronunciation?: string; context: string }>;
  tips: string[];
}

export default function LearnScreen() {
  const { user } = useUser();
  const [data, setData] = useState<LearnPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const onceRef = useRef<boolean>(false);

  const targetLang = useMemo(() => LANGUAGES.find(l => l.code === user.selectedLanguage), [user.selectedLanguage]);
  const nativeLang = useMemo(() => LANGUAGES.find(l => l.code === user.nativeLanguage), [user.nativeLanguage]);

  const fetchLearnData = useCallback(async () => {
    if (!targetLang || !nativeLang) {
      setError('Please select your native and learning languages in settings.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `Create compact structured JSON for a language LEARN page for learners of ${targetLang.name} whose native language is ${nativeLang.name}.
Return ONLY JSON with keys: alphabet, numbers, commonWords, phrases, tips.
- alphabet: 26-40 important items covering the full script/alphabet for ${targetLang.name}. Each item: {id, character, romanization, pronunciation, type, difficulty, examples:[{word, translation (in ${nativeLang.name}), pronunciation}]}.
- numbers: list for 0-20, then tens up to 100. Each: {value, target, pronunciation}.
- commonWords: 30 items mixing themes (people, time, places, food, travel). Each: {target, native (${nativeLang.name}), pronunciation, theme}.
- phrases: 30 high-utility phrases. Each: {target, native (${nativeLang.name}), pronunciation, context}.
- tips: 8 bullet tips about pronunciation, stress, rhythm, polite forms, gender/particles, common pitfalls, mnemonic hooks. Keep tips in ${nativeLang.name}.
Constraints:
- Use plain text, no IPA if unnecessary; keep romanization simple if applicable; omit romanization if language is Latin-based.
- Keep strings short and clean; avoid markdown; ensure valid JSON.`;

      console.log('[Learn] Fetching learn data for', targetLang.code, '->', nativeLang.code);
      const res = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) throw new Error('Failed to generate content');
      const json = await res.json();
      let content: string = String(json.completion ?? '').trim();
      if (content.includes('```')) content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const match = content.match(/\{[\s\S]*\}/);
      if (match) content = match[0];
      const parsed: LearnPayload = JSON.parse(content);

      // Fallback shaping to ensure arrays exist
      const shaped: LearnPayload = {
        alphabet: Array.isArray(parsed.alphabet) ? parsed.alphabet : [],
        numbers: Array.isArray(parsed.numbers) ? parsed.numbers : [],
        commonWords: Array.isArray(parsed.commonWords) ? parsed.commonWords : [],
        phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      };
      setData(shaped);
    } catch (e: unknown) {
      console.error('[Learn] Error', e);
      setError('Could not load learning content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [targetLang, nativeLang]);

  useEffect(() => {
    if (!onceRef.current) {
      onceRef.current = true;
      fetchLearnData();
    }
  }, [fetchLearnData]);

  const sectionHeader = useCallback((icon: React.ReactNode, title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View>{icon}</View>
        <Text style={styles.sectionTitle} testID={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>{title}</Text>
      </View>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  ), []);

  const onPlay = useCallback((raw: string) => {
    const label = (raw ?? '').toString().trim();
    if (!label || label.length > 120) return;
    if (Platform.OS === 'web') {
      console.log('Play audio placeholder:', label);
    } else {
      console.log('Play audio placeholder (native):', label);
    }
  }, []);

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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#34D399", "#10B981"]} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroKicker} testID="learn-kicker">{nativeLang.flag} → {targetLang.flag}</Text>
              <Text style={styles.heroTitle} testID="learn-title">Master {targetLang.name}</Text>
              <Text style={styles.heroSubtitle}>A beautifully curated reference hub: alphabet, numbers, words, phrases, and pro tips — all in one place.</Text>
            </View>
            <View style={styles.heroBadge}>
              <GraduationCap size={28} color="#065F46" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          {sectionHeader(<Grid size={20} color="#10B981" />, 'Alphabet', `Essentials of ${targetLang.name}${targetLang.code.startsWith('en') ? '' : ' with quick romanization'}`)}
          {isLoading && (
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

          {data?.alphabet && data.alphabet.length > 0 && (
            <View style={styles.alphabetGrid}>
              {data.alphabet.map((ch, idx) => (
                <View key={ch.id || `alpha_${idx}`} style={styles.alphabetCard} testID={`alpha-${idx}`}>
                  <Text style={styles.alphaChar}>{ch.character}</Text>
                  {!!ch.romanization && <Text style={styles.alphaRoma}>{ch.romanization}</Text>}
                  <Text style={styles.alphaPron}>{ch.pronunciation}</Text>
                  <View style={styles.alphaExamples}>
                    {ch.examples?.slice(0, 2).map((ex, i) => (
                      <View key={`ex_${i}`} style={styles.exampleRow}>
                        <Text style={styles.exampleWord}>{ex.word}</Text>
                        <Text style={styles.exampleTrans}>{ex.translation}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.soundBtn} onPress={() => onPlay(ch.character)}>
                    <Volume2 size={16} color="#10B981" />
                    <Text style={styles.soundText}>Pronounce</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          {sectionHeader(<Hash size={20} color="#3B82F6" />, 'Numbers', `0–20 and tens up to 100 in ${targetLang.name}`)}
          {isLoading && !data && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.loadingText}>Loading numbers…</Text>
            </View>
          )}
          {data?.numbers && (
            <View>
              <View style={styles.numberRow}>
                {data.numbers.slice(0, 21).map((n) => (
                  <View key={`n_${n.value}`} style={styles.numberPill}>
                    <Text style={styles.numberValue}>{n.value}</Text>
                    <Text style={styles.numberTarget}>{n.target}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.tensRow}>
                {data.numbers.filter(n => n.value % 10 === 0 && n.value >= 20).map((n) => (
                  <View key={`t_${n.value}`} style={styles.tenCard}>
                    <Text style={styles.tenValue}>{n.value}</Text>
                    <Text style={styles.tenTarget}>{n.target}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {sectionHeader(<Sparkles size={20} color="#F59E0B" />, 'Common Words', 'High-frequency vocabulary with translations')}
          <View style={styles.wordsGrid}>
            {data?.commonWords?.slice(0, 24).map((w, i) => (
              <View key={`w_${i}`} style={styles.wordCard}>
                <Text style={styles.wordTarget}>{w.target}</Text>
                <Text style={styles.wordNative}>{w.native}</Text>
                {!!w.theme && <Text style={styles.wordTheme}>{w.theme}</Text>}
              </View>
            ))}
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
                <TouchableOpacity style={styles.soundIcon} onPress={() => onPlay(p.target)}>
                  <Volume2 size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {sectionHeader(<Lightbulb size={20} color="#FCD34D" />, 'Pronunciation & Tips', `Quick wins for ${targetLang.name}`)}
          <View style={styles.tipsCard}>
            {data?.tips?.map((tip, i) => (
              <View key={`tip_${i}`} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={fetchLearnData} style={styles.refreshCta} testID="refresh-learn">
          <RefreshCw size={16} color="#111827" />
          <Text style={styles.refreshText}>Refresh content</Text>
          <ChevronRight size={16} color="#111827" />
        </TouchableOpacity>
      </ScrollView>
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

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginLeft: 8 },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },

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

  phraseRow: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phraseL: { flex: 1, paddingRight: 12 },
  phraseTarget: { fontSize: 16, color: '#111827', fontWeight: '700' },
  phraseNative: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  soundIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' },

  tipsCard: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 8 },
  tipText: { fontSize: 13, color: '#374151', flex: 1 },

  refreshCta: { alignSelf: 'center', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  refreshText: { fontSize: 12, color: '#111827', fontWeight: '700' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  infoText: { marginTop: 12, fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
