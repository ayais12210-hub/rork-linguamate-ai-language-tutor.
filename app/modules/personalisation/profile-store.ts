import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferenceProfile, TPreferenceProfile } from '@/schemas/preferences';
import { mapAnswerToProfile } from './mapper';

const STORAGE_KEY = 'pref_profile_v1';
const ETAG_KEY = 'pref_profile_v1_etag';

export const [PreferenceProvider, usePreferenceProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<TPreferenceProfile | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('[PrefStore] hydrate');
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const tag = await AsyncStorage.getItem(ETAG_KEY);
        if (raw) {
          const parsed = PreferenceProfile.parse(JSON.parse(raw));
          setProfile(parsed);
        }
        setEtag(tag);
      } catch (e: unknown) {
        console.log('[PrefStore] hydrate error', e);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateFromOnboarding = useCallback(async (answers: unknown) => {
    try {
      const { profile } = mapAnswerToProfile(answers);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setProfile(profile);
      return profile;
    } catch (e: unknown) {
      console.log('[PrefStore] map error', e);
      setError('Could not apply preferences');
      throw e;
    }
  }, []);

  const value = useMemo(() => ({ profile, etag, setEtag, setProfile, loading, error, updateFromOnboarding }), [profile, etag, loading, error, updateFromOnboarding]);

  return value;
});

export function usePersonalisedLessonPlan() {
  const { profile } = usePreferenceProfile();
  return profile?.lessonPlan ?? null;
}

export function useSRSConfig() {
  const { profile } = usePreferenceProfile();
  return profile?.srs ?? null;
}

export function useSpeechConfig() {
  const { profile } = usePreferenceProfile();
  return profile?.speech ?? null;
}

export function useNotificationPrefs() {
  const { profile } = usePreferenceProfile();
  return profile?.notifications ?? null;
}
