# Difficulty Adaptation System

## Overview

Linguamate features a comprehensive difficulty adaptation system that tailors the learning experience based on user proficiency. The system supports three difficulty levels: **Beginner**, **Intermediate**, and **Advanced**, each with distinct parameters that affect UX, content, pacing, and evaluation.

## Difficulty Levels

### Beginner
- **Target Accuracy**: 75%
- **Max Retries**: 2
- **Hints**: Enabled
- **Translations**: Enabled
- **Speech Rate**: 0.85x (slower)
- **Items per Session**: 6
- **Exercise Mix**: 40% MCQ, 20% Pairs, 20% Gap-fill, 20% Listen
- **SRS Intervals**: 15min, 1h, 6h, 24h
- **XP per Correct**: 8
- **Penalty per Wrong**: 0

### Intermediate
- **Target Accuracy**: 82%
- **Max Retries**: 1
- **Hints**: Enabled
- **Translations**: Disabled
- **Speech Rate**: 1.0x (normal)
- **Items per Session**: 10
- **Exercise Mix**: 25% Gap-fill, 25% Typing, 25% Listen, 25% Speak
- **SRS Intervals**: 10min, 2h, 12h, 48h
- **XP per Correct**: 10
- **Penalty per Wrong**: 2

### Advanced
- **Target Accuracy**: 90%
- **Max Retries**: 0
- **Hints**: Disabled
- **Translations**: Disabled
- **Speech Rate**: 1.15x (faster)
- **Items per Session**: 14
- **Exercise Mix**: 35% Typing, 20% Order, 25% Listen, 20% Speak
- **SRS Intervals**: 5min, 4h, 24h, 72h
- **XP per Correct**: 12
- **Penalty per Wrong**: 4

## Architecture

### Core Components

1. **Schema** (`schemas/difficulty.schema.ts`)
   - Defines `Difficulty` enum and `DifficultyParams` type
   - Contains `DIFFICULTY_PRESETS` with all configuration

2. **State Management** (`state/preferencesStore.ts`)
   - Zustand store with AsyncStorage persistence
   - Manages current difficulty and auto-adapt setting
   - Provides `setDifficulty`, `getParam`, and `setAutoAdapt` actions

3. **Logic Helpers** (`modules/lessons/logic/difficulty.ts`)
   - `pickExerciseType()`: Weighted random exercise selection
   - `getSessionItemCount()`: Returns items per session
   - `getSpeechRate()`: Returns TTS speed multiplier
   - `showHints()`, `showTranslations()`: UI affordance toggles
   - `scoring()`: Returns XP and penalty values
   - `getSRSIntervals()`: Returns spaced repetition intervals

4. **Adaptive Engine** (`modules/lessons/logic/adaptive.ts`)
   - `evaluateSessionAccuracy()`: Determines promote/demote/stay signal
   - `maybeAdjustDifficulty()`: Applies difficulty changes when auto-adapt is enabled

5. **Analytics** (`lib/analytics.ts`)
   - Tracks difficulty selection events
   - Tracks auto-adaptation events
   - Tracks session metrics

## Usage

### Setting Difficulty

Users can set difficulty in two places:

1. **Onboarding** (Step 3):
```typescript
import { usePreferences } from '@/state/preferencesStore';
import { trackDifficultySelect } from '@/lib/analytics';

const { setDifficulty } = usePreferences();
setDifficulty('intermediate');
trackDifficultySelect('intermediate', 'onboarding');
```

2. **Settings Screen**:
```typescript
const { setDifficulty } = usePreferences();
setDifficulty('advanced');
trackDifficultySelect('advanced', 'settings');
```

### Using Difficulty Parameters

In lesson/exercise components:

```typescript
import {
  getSessionItemCount,
  showHints,
  getSpeechRate,
  scoring,
} from '@/modules/lessons/logic/difficulty';

// Generate session
const itemCount = getSessionItemCount(); // 6, 10, or 14

// Show/hide UI elements
const hintsEnabled = showHints(); // true/false

// Configure TTS
const rate = getSpeechRate(); // 0.85, 1.0, or 1.15

// Calculate XP
const { xpPerCorrect, penaltyPerWrong } = scoring();
```

### Auto-Adaptation

Enable auto-adapt in settings:

```typescript
const { setAutoAdapt } = usePreferences();
setAutoAdapt(true);
```

At session end:

```typescript
import {
  evaluateSessionAccuracy,
  maybeAdjustDifficulty,
} from '@/modules/lessons/logic/adaptive';
import { trackSessionMetrics } from '@/lib/analytics';

const sessionId = crypto.randomUUID();
const correct = 9;
const total = 10;

// Track metrics
trackSessionMetrics(difficulty, correct, total, sessionId);

// Evaluate and adapt
const signal = evaluateSessionAccuracy(correct, total);
const newDiff = maybeAdjustDifficulty(signal, sessionId, correct / total);

if (newDiff) {
  console.log(`Difficulty adjusted to ${newDiff}`);
}
```

## Adaptation Rules

### Promotion
- Accuracy ≥ Target + 7%
- Example: Beginner (75% target) → promote at 82%+

### Demotion
- Accuracy ≤ Target - 12%
- Example: Intermediate (82% target) → demote at 70% or below

### Boundaries
- Cannot promote beyond Advanced
- Cannot demote below Beginner
- Only applies when auto-adapt is enabled

## Testing

Run tests:
```bash
npm test __tests__/difficulty.schema.test.ts
npm test __tests__/preferences.store.test.ts
npm test modules/lessons/tests/difficulty.logic.test.ts
npm test modules/lessons/tests/adaptive.test.ts
```

## Analytics Events

### `difficulty_select`
```typescript
{
  type: 'difficulty_select',
  level: 'beginner' | 'intermediate' | 'advanced',
  source: 'onboarding' | 'settings'
}
```

### `difficulty_auto_adapt`
```typescript
{
  type: 'difficulty_auto_adapt',
  from: Difficulty,
  to: Difficulty,
  sessionId: string,
  accuracy: number
}
```

### `session_metrics`
```typescript
{
  type: 'session_metrics',
  level: Difficulty,
  correct: number,
  total: number,
  accuracy: number,
  sessionId: string
}
```

## Best Practices

1. **Always use helpers**: Don't access `params` directly; use helper functions
2. **Track events**: Call analytics functions when difficulty changes
3. **Test thoroughly**: Ensure UI adapts correctly to all difficulty levels
4. **Respect user choice**: Only auto-adapt when explicitly enabled
5. **Provide feedback**: Show users when difficulty changes automatically

## Future Enhancements

- Per-skill difficulty tracking
- Machine learning-based adaptation
- Custom difficulty profiles
- Difficulty history and trends
- A/B testing different thresholds
