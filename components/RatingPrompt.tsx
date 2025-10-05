import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Star, X, ThumbsUp } from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';

interface RatingState {
  hasRated: boolean;
  dismissCount: number;
  lastPromptAt: number | null;
}

const STORAGE_KEY = 'rating_prompt_state_v1';

function useRatingLogic() {
  const { user } = useUser();
  const [state, setState] = useState<RatingState>({ hasRated: false, dismissCount: 0, lastPromptAt: null });
  const [visible, setVisible] = useState<boolean>(false);

  const canPrompt = useMemo(() => {
    if (state.hasRated) return false;
    const now = Date.now();
    const last = state.lastPromptAt ?? 0;
    const minGap = state.dismissCount === 0 ? 2 * 24 * 60 * 60 * 1000 : Math.min(14, 2 ** state.dismissCount) * 24 * 60 * 60 * 1000;
    const gapOk = now - last > minGap;
    const hasProgress = (user.stats?.totalChats ?? 0) + (user.stats?.wordsLearned ?? 0) > 5;
    return gapOk && hasProgress;
  }, [state.hasRated, state.lastPromptAt, state.dismissCount, user.stats?.totalChats, user.stats?.wordsLearned]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as RatingState;
          setState({
            hasRated: !!parsed.hasRated,
            dismissCount: typeof parsed.dismissCount === 'number' ? parsed.dismissCount : 0,
            lastPromptAt: typeof parsed.lastPromptAt === 'number' ? parsed.lastPromptAt : null,
          });
        } catch (e) {
          if (__DEV__) {

            console.log('[RatingPrompt] parse error', e);

          }
        }
      }
    }).catch((e) => console.log('[RatingPrompt] load error', e));
  }, []);

  useEffect(() => {
    if (canPrompt) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [canPrompt]);

  const persist = useCallback((next: Partial<RatingState>) => {
    setState((prev) => {
      const merged: RatingState = { ...prev, ...next } as RatingState;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch((e) => console.log('[RatingPrompt] save error', e));
      return merged;
    });
  }, []);

  const onDismiss = useCallback(() => {
    setVisible(false);
    persist({ dismissCount: (state.dismissCount ?? 0) + 1, lastPromptAt: Date.now() });
  }, [persist, state.dismissCount]);

  const onRate = useCallback(() => {
    setVisible(false);
    persist({ hasRated: true, lastPromptAt: Date.now() });
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/id000000000?action=write-review',
      android: 'https://play.google.com/store/apps/details?id=com.linguamate.app&reviewId=0',
      default: 'https://linguamate.app',
    }) as string;
    Linking.openURL(url).catch(() => {});
  }, [persist]);

  const onFeedback = useCallback(() => {
    setVisible(false);
    persist({ lastPromptAt: Date.now() });
    const email = 'support@linguamate.app';
    const subject = 'Feedback for LinguaMate';
    const body = 'Hi team, here is my feedback:';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url).catch(() => {});
  }, [persist]);

  return { visible, onDismiss, onRate, onFeedback };
}

export default function RatingPrompt() {
  const { visible, onDismiss, onRate, onFeedback } = useRatingLogic();

  const Content = (
    <View style={styles.container} testID="rating-prompt">
      <View style={styles.card}>
        <TouchableOpacity accessibilityRole="button" onPress={onDismiss} style={styles.closeBtn} testID="rating-close">
          <X size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Star size={28} color="#F59E0B" />
        </View>
        <Text style={styles.title}>Enjoying LinguaMate?</Text>
        <Text style={styles.subtitle}>If you like the app, would you mind taking a moment to rate it? It won’t take more than a minute. Thanks for your support!</Text>
        <View style={styles.row}>
          <TouchableOpacity accessibilityRole="button" onPress={onFeedback} style={[styles.btn, styles.secondary]} testID="rating-feedback">
            <ThumbsUp size={16} color="#111827" />
            <Text style={styles.secondaryText}>Send Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={onRate} style={[styles.btn, styles.primary]} testID="rating-rate">
            <Text style={styles.primaryText}>Rate App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return visible ? (
      <View style={styles.webOverlay} pointerEvents="auto">
        {Content}
      </View>
    ) : null;
  }
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {Content}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  webOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  container: { width: '92%', maxWidth: 440 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  closeBtn: { position: 'absolute', right: 8, top: 8, padding: 8 },
  headerIcon: { alignSelf: 'center', backgroundColor: '#FFF7ED', padding: 12, borderRadius: 999, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primary: { backgroundColor: '#10B981' },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondary: { backgroundColor: '#F3F4F6' },
  secondaryText: { color: '#111827', fontSize: 14, fontWeight: '600' },
});