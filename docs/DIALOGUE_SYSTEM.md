# Adaptive Dialogue System - Implementation Guide

## Overview

The Linguamate Adaptive Dialogue System provides contextual, goal-driven conversations with real-time coaching, scoring, and spaced repetition. It adapts to user difficulty levels (beginner/intermediate/advanced) and supports both text and audio input/output.

## Architecture

### 1. Schemas (`schemas/dialogue.schema.ts`)

- **Turn**: Individual conversation turn (system/coach/user/npc)
- **Scene**: Conversation scenario with goal and key phrases
- **Topic**: Collection of related scenes
- **Score**: Turn-level performance metrics
- **Session**: Complete dialogue session with turns and scores

### 2. Logic Layer (`modules/dialogue/logic/`)

#### Adaptation (`adaptation.ts`)
- Difficulty-aware parameters (maxTurns, hintMode, coachTone, targetCER, etc.)
- Reads from `usePreferences` store
- Returns `DialogueParams` for current difficulty level

#### FSM (`fsm.ts`)
- Finite state machine: idle → intro → userTurn → scoring → coachFeedback → ended
- `useDialogueFSM` hook manages state transitions
- Deterministic flow with goal achievement detection

#### Scoring (`scoring.ts`)
- Client-side: CER (Character Error Rate), keyword matching, fluency
- Server-side: Semantic scoring via tRPC (optional)
- `combineScores`: Weighted combination (50% semantic + 30% accuracy + 20% fluency)
- Adaptive feedback based on difficulty and coach tone

#### Normalization (`normalization.ts`)
- Accent-insensitive text normalization (NFD + diacritic removal)
- Levenshtein distance for CER/WER calculation
- Tokenization for keyword matching

#### SRS (`srs.ts`)
- Spaced repetition scheduling based on performance
- Uses difficulty preset intervals (e.g., beginner: 15m, 1h, 6h, 24h)
- `calculateNextReview`: Determines next review timestamp
- `isDue`: Checks if session is due for review

### 3. Data Layer (`modules/dialogue/data/`)

#### Queries (`dialogue.queries.ts`)
- `useTopics()`: Fetch all dialogue topics
- `useScenes(topicId)`: Fetch scenes for a topic
- `useTranscript(sessionId)`: Fetch session transcript

#### Mutations (`dialogue.mutations.ts`)
- `useStartSession()`: Initialize new dialogue session
- `useSubmitTurn()`: Submit user turn and get score
- `useEndSession()`: Complete session
- `useScoreSemantic()`: Optional server-side semantic scoring

### 4. State Management

#### Dialogue Queue Store (`state/dialogueQueueStore.ts`)
- Persisted Zustand store for sessions and review queue
- Offline queue for pending actions
- SRS review queue with `getDueReviews()`
- Session CRUD operations

### 5. Backend (`backend/trpc/routes/dialogue/`)

#### Router (`dialogue.ts`)
- `getTopics`: List all topics
- `getScenes`: Get scenes by topic
- `startSession`: Create new session
- `submitTurn`: Process user turn, apply safety checks, return score
- `endSession`: Finalize session
- `getTranscript`: Retrieve session history
- `scoreSemantic`: Server-side semantic scoring

#### Services
- **Safety (`safety.ts`)**: Profanity filter, PII detection/redaction
- **Scorer (`scorer.ts`)**: Basic semantic scoring (keyword overlap)
- **Data (`data.ts`)**: Mock topics, scenes, and in-memory session storage

### 6. UI Components (`modules/dialogue/ui/components/`)

- **TurnBubble**: Renders conversation turns with role-based styling
- **MicButton**: Animated recording button with pulse effect
- **CoachTip**: Contextual hints with tone-based icons
- **ScorePill**: Visual score display with color coding

## Usage Flow

### 1. Start a Dialogue Session

\`\`\`typescript
import { useStartSession } from '@/modules/dialogue/data';
import { useDialogueFSM } from '@/modules/dialogue/logic';
import { getDialogueParams } from '@/modules/dialogue/logic';

const startMutation = useStartSession();
const params = getDialogueParams('en');

// Start session
const session = await startMutation.mutateAsync({
  sceneId: 'scene-uuid',
  difficulty: 'beginner'
});

// Initialize FSM
const { state, turns, scores, dispatch } = useDialogueFSM(scene, params);
dispatch({ type: 'START' });
\`\`\`

### 2. Submit User Turn

\`\`\`typescript
import { useSubmitTurn } from '@/modules/dialogue/data';
import { scoreClientSide } from '@/modules/dialogue/logic';

const submitMutation = useSubmitTurn();

// Client-side scoring
const clientScore = scoreClientSide({
  userText: 'Hello, my name is John',
  keyPhrases: scene.keyPhrases,
  params
});

// Submit to server
const result = await submitMutation.mutateAsync({
  sessionId: session.id,
  text: 'Hello, my name is John'
});

// Update FSM
dispatch({ type: 'USER_INPUT', text: 'Hello, my name is John' });
dispatch({ type: 'SCORE', score: result.score });
\`\`\`

### 3. End Session and Schedule Review

\`\`\`typescript
import { useEndSession } from '@/modules/dialogue/data';
import { calculateNextReview } from '@/modules/dialogue/logic';
import { useDialogueQueue } from '@/state/dialogueQueueStore';

const endMutation = useEndSession();

// End session
const finalSession = await endMutation.mutateAsync({ sessionId: session.id });

// Calculate SRS
const srsDueAt = calculateNextReview(finalSession.scores, finalSession.difficulty);

// Add to review queue
useDialogueQueue.getState().updateSession(session.id, { srsDueAt });
useDialogueQueue.getState().addToReviewQueue(session.id);
\`\`\`

## Difficulty Adaptation

### Parameters by Level

| Parameter | Beginner | Intermediate | Advanced |
|-----------|----------|--------------|----------|
| maxTurns | 8 | 12 | 16 |
| hintMode | active | passive | none |
| coachTone | gentle | neutral | strict |
| targetCER | 0.25 | 0.18 | 0.12 |
| requiredKeywords | 1 | 2 | 3 |

### Adaptive Feedback Examples

**Beginner (gentle, active hints)**:
- "Excellent! You nailed it! 🎉"
- "Let's try again. Use: 'hello'"

**Intermediate (neutral, passive hints)**:
- "Great job!"
- "Good effort! Try including: 'my name is'"

**Advanced (strict, no hints)**:
- "Correct."
- "Needs improvement."

## Offline Support

1. **Queue Actions**: When offline, actions are queued in `dialogueQueueStore.offlineQueue`
2. **Replay on Reconnect**: Use `dequeueAction()` to replay pending actions
3. **Idempotency**: Include unique IDs to prevent duplicate submissions
4. **Cached Scenes**: Store scenes locally for offline access

## Testing

### Unit Tests

\`\`\`typescript
// FSM state transitions
test('FSM transitions from idle to intro on START', () => {
  const state = reduce({ kind: 'idle' }, { type: 'START' }, ctx);
  expect(state.kind).toBe('intro');
});

// Scoring accuracy
test('scoreClientSide calculates CER correctly', () => {
  const result = scoreClientSide({
    userText: 'hello',
    keyPhrases: ['hello'],
    params
  });
  expect(result.accuracy).toBeGreaterThan(0.9);
});

// SRS scheduling
test('calculateNextReview schedules based on performance', () => {
  const dueAt = calculateNextReview([{ accuracy: 0.9 }], 'beginner');
  expect(dueAt).toBeGreaterThan(Date.now());
});
\`\`\`

## Next Steps

### Screens to Implement

1. **DialogueHub** (`modules/dialogue/ui/DialogueHub.tsx`)
   - Grid of topics with progress
   - "Due for Review" section
   - Search/filter by tag/level

2. **SceneScreen** (`modules/dialogue/ui/SceneScreen.tsx`)
   - Live conversation view
   - Turn-by-turn display with TurnBubble
   - MicButton + text input
   - CoachTip for hints
   - ScorePill footer

3. **ReviewScreen** (`modules/dialogue/ui/ReviewScreen.tsx`)
   - Full transcript
   - Per-turn scores
   - Audio playback
   - "Re-try scene" CTA

### Integration

1. Add route: `app/(tabs)/learn/dialogue.tsx`
2. Link from Learn tab
3. Wire navigation to SceneScreen with scene ID
4. Add analytics events (dialogue_start, dialogue_turn, dialogue_end)

### Enhancements

- **TTS Integration**: Use Expo Speech for audio playback
- **STT Integration**: Capture audio input and transcribe
- **LLM Semantic Scoring**: Upgrade scorer.ts with embeddings or LLM API
- **Pronunciation Feedback**: Add IPA comparison and phoneme-level scoring
- **AI-Generated Scenes**: Dynamic scene generation based on user progress

## API Reference

### tRPC Procedures

\`\`\`typescript
trpc.dialogue.getTopics.useQuery()
trpc.dialogue.getScenes.useQuery({ topicId })
trpc.dialogue.startSession.useMutation()
trpc.dialogue.submitTurn.useMutation()
trpc.dialogue.endSession.useMutation()
trpc.dialogue.getTranscript.useQuery({ sessionId })
trpc.dialogue.scoreSemantic.useMutation()
\`\`\`

### Hooks

\`\`\`typescript
useDialogueFSM(scene, params)
useDialogueQueue()
usePreferences()
\`\`\`

### Functions

\`\`\`typescript
getDialogueParams(lang): DialogueParams
scoreClientSide(input): ScoringResult
combineScores(clientScore, semanticScore): ScoringResult
calculateNextReview(scores, difficulty): number
isDue(srsDueAt): boolean
normalize(text): string
calculateCER(reference, hypothesis): number
\`\`\`

## Safety & Moderation

- **Profanity Filter**: Blocks inappropriate language
- **PII Redaction**: Removes emails, phone numbers, credit cards
- **User Override**: Flagged content returns coach message, no storage
- **Logging**: All safety events logged with correlationId

## Performance Considerations

- **Client-side Scoring**: Instant feedback without network latency
- **Lazy Loading**: Load scenes on-demand
- **Memoization**: Use `useMemo` for filtered/sorted data
- **Offline Queue**: Batch replay on reconnect
- **Session Cleanup**: Expire old sessions after 30 days

## Accessibility

- **Screen Reader**: All components have `accessibilityLabel` and `accessibilityRole`
- **Touch Targets**: Minimum 44x44 for buttons
- **High Contrast**: Coach tips and score pills use distinct colors
- **RTL Support**: Layout adapts for right-to-left languages

---

**Status**: Core logic, backend, and UI components implemented. Screens and navigation pending.
