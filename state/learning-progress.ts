import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type MasteryLevel = 'new' | 'learning' | 'review' | 'mastered';

export interface SkillProgress {
  id: string;
  type: 'alphabet' | 'number' | 'vowel' | 'consonant' | 'syllable' | 'word' | 'grammar';
  label: string;
  accuracy: number;
  attempts: number;
  streak: number;
  lastPracticedAt?: string;
  mastery: MasteryLevel;
}

export interface LearningProgressState {
  skills: Record<string, SkillProgress>;
  isLoading: boolean;
  upsertSkill: (skill: SkillProgress) => void;
  recordResult: (id: string, correct: boolean) => void;
  reset: () => void;
  getByType: (type: SkillProgress['type']) => SkillProgress[];
}

const STORAGE_KEY = 'linguamate_learning_progress_v1';

export const [LearningProgressProvider, useLearningProgress] = createContextHook<LearningProgressState>(() => {
  const [skills, setSkills] = useState<Record<string, SkillProgress>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => {
        if (v) {
          const parsed = JSON.parse(v) as Record<string, SkillProgress>;
          setSkills(parsed);
        }
      })
      .catch(err => {
        if (__DEV__) {

          console.log('load progress error', err);

        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(skills)).catch(err => {
        if (__DEV__) {

          console.log('save progress error', err);

        }
      });
    }
  }, [skills, isLoading]);

  const upsertSkill = useCallback((skill: SkillProgress) => {
    setSkills(prev => ({ ...prev, [skill.id]: skill }));
  }, []);

  const nextMastery = (current: MasteryLevel, correct: boolean): MasteryLevel => {
    const order: MasteryLevel[] = ['new', 'learning', 'review', 'mastered'];
    const idx = order.indexOf(current);
    if (correct) {
      return order[Math.min(idx + 1, order.length - 1)];
    }
    return order[Math.max(idx - 1, 0)];
  };

  const recordResult = useCallback((id: string, correct: boolean) => {
    setSkills(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const accuracyBase = existing.accuracy * existing.attempts;
      const newAttempts = existing.attempts + 1;
      const newAccuracy = (accuracyBase + (correct ? 1 : 0)) / newAttempts;
      const updated: SkillProgress = {
        ...existing,
        attempts: newAttempts,
        accuracy: newAccuracy,
        streak: correct ? existing.streak + 1 : 0,
        mastery: nextMastery(existing.mastery, correct),
        lastPracticedAt: new Date().toISOString(),
      };
      return { ...prev, [id]: updated };
    });
  }, []);

  const reset = useCallback(() => {
    setSkills({});
  }, []);

  const getByType = useCallback((type: SkillProgress['type']) => {
    return Object.values(skills).filter(s => s.type === type);
  }, [skills]);

  return useMemo(() => ({ skills, isLoading, upsertSkill, recordResult, reset, getByType }), [skills, isLoading, upsertSkill, recordResult, reset, getByType]);
});
