import { useState, useCallback, useRef, useEffect } from 'react';
import { Scene, Turn, Score } from '@/schemas/dialogue.schema';
import { DialogueParams } from './adaptation';

export type DState =
  | { kind: 'idle' }
  | { kind: 'intro'; turnIdx: number }
  | { kind: 'userTurn'; turnIdx: number }
  | { kind: 'scoring'; turnIdx: number }
  | { kind: 'coachFeedback'; turnIdx: number; score: Score }
  | { kind: 'ended'; avgScore: number };

export type DEvent =
  | { type: 'START' }
  | { type: 'USER_INPUT'; text: string; audioUrl?: string }
  | { type: 'SCORE'; score: Score }
  | { type: 'NEXT' }
  | { type: 'END' };

export type DContext = {
  scene: Scene;
  params: DialogueParams;
  turns: Turn[];
  scores: Score[];
};

export function reduce(
  state: DState,
  event: DEvent,
  ctx: DContext
): DState {
  switch (state.kind) {
    case 'idle':
      if (event.type === 'START') {
        return { kind: 'intro', turnIdx: 0 };
      }
      return state;

    case 'intro':
      if (event.type === 'NEXT') {
        if (state.turnIdx < ctx.scene.starterTurns.length - 1) {
          return { kind: 'intro', turnIdx: state.turnIdx + 1 };
        }
        return { kind: 'userTurn', turnIdx: ctx.turns.length };
      }
      return state;

    case 'userTurn':
      if (event.type === 'USER_INPUT') {
        return { kind: 'scoring', turnIdx: state.turnIdx };
      }
      return state;

    case 'scoring':
      if (event.type === 'SCORE') {
        return {
          kind: 'coachFeedback',
          turnIdx: state.turnIdx,
          score: event.score,
        };
      }
      return state;

    case 'coachFeedback':
      if (event.type === 'NEXT') {
        const shouldEnd =
          ctx.turns.length >= ctx.params.maxTurns ||
          isGoalAchieved(ctx.scores, ctx.params);

        if (shouldEnd) {
          const avgScore = calculateAvgScore(ctx.scores);
          return { kind: 'ended', avgScore };
        }

        return { kind: 'userTurn', turnIdx: ctx.turns.length };
      }
      if (event.type === 'END') {
        const avgScore = calculateAvgScore(ctx.scores);
        return { kind: 'ended', avgScore };
      }
      return state;

    case 'ended':
      return state;

    default:
      return state;
  }
}

function isGoalAchieved(scores: Score[], params: DialogueParams): boolean {
  if (scores.length < 3) return false;

  const recentScores = scores.slice(-3);
  const avgAccuracy =
    recentScores.reduce((sum, s) => sum + s.accuracy, 0) / recentScores.length;

  return avgAccuracy >= 0.85;
}

function calculateAvgScore(scores: Score[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length;
}

export function useDialogueFSM(scene: Scene, params: DialogueParams) {
  const [state, setState] = useState<DState>({ kind: 'idle' });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  // Use refs to track the latest values without triggering re-renders
  const turnsRef = useRef(turns);
  const scoresRef = useRef(scores);
  const stateRef = useRef(state);

  // Keep refs in sync with state
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatch = useCallback(
    (event: DEvent) => {
      console.log('[DialogueFSM] Event:', event.type, 'State:', stateRef.current.kind);

      if (event.type === 'USER_INPUT') {
        const newTurn: Turn = {
          id: crypto.randomUUID(),
          role: 'user',
          text: event.text,
          audioUrl: event.audioUrl,
          lang: params.sttLanguage,
          timeMs: Date.now(),
        };
        setTurns((prev) => [...prev, newTurn]);
        turnsRef.current = [...turnsRef.current, newTurn];
      }

      if (event.type === 'SCORE') {
        setScores((prev) => [...prev, event.score]);
        scoresRef.current = [...scoresRef.current, event.score];
      }

      // Use the latest values from refs to compute next state
      const ctx: DContext = { 
        scene, 
        params, 
        turns: turnsRef.current, 
        scores: scoresRef.current 
      };
      const nextState = reduce(stateRef.current, event, ctx);
      setState(nextState);
    },
    [scene, params]
  );

  return {
    state,
    turns,
    scores,
    dispatch,
  };
}
