# Schema Contracts

## Overview

All data crossing boundaries (API, storage, state) in Linguamate must be validated using Zod schemas. This document defines the core schemas and their relationships.

## Core Principles

1. **Single Source of Truth**: All schemas live in `/schemas`
2. **Validation at Boundaries**: Validate on API requests/responses, storage read/write, state hydration
3. **Type Inference**: Use `z.infer<typeof Schema>` to derive TypeScript types
4. **Composition**: Build complex schemas from simpler ones
5. **Runtime Safety**: Catch invalid data before it enters the system

## Schema Organization

```
/schemas/
  common.ts           # Shared primitives (ID, timestamp, etc.)
  auth.ts             # Authentication schemas
  user.schema.ts      # User and profile schemas
  lesson.schema.ts    # Lesson and exercise schemas
  chat.schema.ts      # Chat message schemas
  preferences.ts      # User preferences
  persist.schema.ts   # AsyncStorage persistence schemas
  errors.ts           # Error response schemas
  feedback.ts         # User feedback schemas
  index.ts            # Barrel export
```

## Common Schemas

### Primitives

```typescript
// schemas/common.ts
import { z } from 'zod';

export const IdSchema = z.string().uuid();
export const TimestampSchema = z.number().int().positive();
export const ISODateSchema = z.string().datetime();
export const LanguageCodeSchema = z.string().length(2); // ISO 639-1
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative().optional(),
});

export const MetadataSchema = z.object({
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema.optional(),
  deletedAt: TimestampSchema.optional(),
});
```

## User Schemas

```typescript
// schemas/user.schema.ts
import { z } from 'zod';
import { IdSchema, EmailSchema, LanguageCodeSchema, MetadataSchema } from './common';

export const UserStatsSchema = z.object({
  xpPoints: z.number().int().nonnegative().default(0),
  wordsLearned: z.number().int().nonnegative().default(0),
  lessonsCompleted: z.number().int().nonnegative().default(0),
  streakDays: z.number().int().nonnegative().default(0),
  totalChats: z.number().int().nonnegative().default(0),
  lastActiveDate: z.string().optional(),
});

export const UserSettingsSchema = z.object({
  darkMode: z.boolean().default(false),
  notifications: z.boolean().default(true),
  soundEffects: z.boolean().default(true),
  autoPlayAudio: z.boolean().default(true),
  speechRate: z.number().min(0.5).max(2.0).default(1.0),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
});

export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  nativeLanguage: LanguageCodeSchema,
  selectedLanguage: LanguageCodeSchema,
  stats: UserStatsSchema.optional(),
  settings: UserSettingsSchema.optional(),
  ...MetadataSchema.shape,
});

export type User = z.infer<typeof UserSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
```

## Lesson Schemas

```typescript
// schemas/lesson.schema.ts
import { z } from 'zod';
import { IdSchema, LanguageCodeSchema, MetadataSchema } from './common';

export const ExerciseTypeSchema = z.enum([
  'mcq',              // Multiple choice
  'fill-blank',       // Fill in the blank
  'translation',      // Translate sentence
  'listening',        // Listen and type
  'speaking',         // Speak and record
  'matching',         // Match pairs
  'ordering',         // Order words/sentences
]);

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const ExerciseSchema = z.object({
  id: IdSchema,
  type: ExerciseTypeSchema,
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  hints: z.array(z.string()).optional(),
  xpReward: z.number().int().positive().default(10),
});

export const LessonSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  language: LanguageCodeSchema,
  level: DifficultySchema,
  exercises: z.array(ExerciseSchema).min(1),
  xpReward: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(IdSchema).optional(),
  ...MetadataSchema.shape,
});

export const LessonProgressSchema = z.object({
  lessonId: IdSchema,
  userId: IdSchema,
  completed: z.boolean().default(false),
  score: z.number().min(0).max(100).optional(),
  xpEarned: z.number().int().nonnegative().default(0),
  attempts: z.number().int().nonnegative().default(0),
  lastAttemptAt: z.number().optional(),
  completedAt: z.number().optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type ExerciseType = z.infer<typeof ExerciseTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
```

## Chat Schemas

```typescript
// schemas/chat.schema.ts
import { z } from 'zod';
import { IdSchema, TimestampSchema } from './common';

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const MessageContentSchema = z.union([
  z.string(),
  z.array(z.object({
    type: z.enum(['text', 'image']),
    text: z.string().optional(),
    image: z.string().optional(), // base64 or URL
  })),
]);

export const ChatMessageSchema = z.object({
  id: IdSchema,
  role: MessageRoleSchema,
  content: MessageContentSchema,
  timestamp: TimestampSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const ChatSessionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  messages: z.array(ChatMessageSchema),
  language: z.string().length(2),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
```

## Preferences Schemas

```typescript
// schemas/preferences.ts
import { z } from 'zod';

export const LearningStyleSchema = z.enum(['visual', 'auditory', 'kinesthetic', 'reading']);
export const PaceSchema = z.enum(['slow', 'moderate', 'fast']);
export const FocusAreaSchema = z.enum(['vocabulary', 'grammar', 'pronunciation', 'conversation']);

export const LearningPreferencesSchema = z.object({
  learningStyle: LearningStyleSchema.optional(),
  pace: PaceSchema.default('moderate'),
  focusAreas: z.array(FocusAreaSchema).default(['vocabulary', 'grammar']),
  dailyGoalMinutes: z.number().int().positive().default(15),
  reminderTime: z.string().optional(), // HH:MM format
  weeklyGoalDays: z.number().int().min(1).max(7).default(5),
});

export type LearningPreferences = z.infer<typeof LearningPreferencesSchema>;
export type LearningStyle = z.infer<typeof LearningStyleSchema>;
export type Pace = z.infer<typeof PaceSchema>;
export type FocusArea = z.infer<typeof FocusAreaSchema>;
```

## Persistence Schemas

```typescript
// schemas/persist.schema.ts
import { z } from 'zod';
import { UserSchema } from './user.schema';
import { LessonProgressSchema } from './lesson.schema';
import { ChatSessionSchema } from './chat.schema';

export const PersistedUserSchema = z.object({
  version: z.literal(1),
  data: UserSchema,
  lastSyncedAt: z.number(),
});

export const PersistedProgressSchema = z.object({
  version: z.literal(1),
  data: z.array(LessonProgressSchema),
  lastSyncedAt: z.number(),
});

export const PersistedChatSchema = z.object({
  version: z.literal(1),
  data: z.array(ChatSessionSchema),
  lastSyncedAt: z.number(),
});

export type PersistedUser = z.infer<typeof PersistedUserSchema>;
export type PersistedProgress = z.infer<typeof PersistedProgressSchema>;
export type PersistedChat = z.infer<typeof PersistedChatSchema>;
```

## Error Schemas

```typescript
// schemas/errors.ts
import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
]);

export const ErrorResponseSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
```

## Usage Examples

### API Request Validation

```typescript
// backend/trpc/procedures/lessons.ts
import { LessonSchema } from '@schemas/lesson.schema';
import { z } from 'zod';

export const getLessonProcedure = publicProcedure
  .input(z.object({ lessonId: z.string().uuid() }))
  .output(LessonSchema)
  .query(async ({ input }) => {
    const lesson = await db.lessons.findById(input.lessonId);
    return LessonSchema.parse(lesson); // Runtime validation
  });
```

### AsyncStorage Validation

```typescript
// lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedUserSchema } from '@schemas/persist.schema';

export async function loadUser() {
  const raw = await AsyncStorage.getItem('user');
  if (!raw) return null;
  
  const parsed = JSON.parse(raw);
  const result = PersistedUserSchema.safeParse(parsed);
  
  if (!result.success) {
    console.error('Invalid user data:', result.error);
    await AsyncStorage.removeItem('user'); // Clear corrupted data
    return null;
  }
  
  return result.data.data;
}
```

### State Hydration Validation

```typescript
// state/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSchema } from '@schemas/user.schema';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          const result = UserSchema.safeParse(state.user);
          if (!result.success) {
            console.error('Invalid user state:', result.error);
            state.user = null;
          }
        }
      },
    }
  )
);
```

### Form Validation

```typescript
// modules/auth/ui/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EmailSchema } from '@schemas/common';

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(LoginSchema),
  });
  
  const onSubmit = (data: z.infer<typeof LoginSchema>) => {
    // data is fully typed and validated
  };
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

## Schema Relationships

```
User
  ├── UserStats
  ├── UserSettings
  └── LearningPreferences

Lesson
  ├── Exercise[]
  └── LessonProgress (per user)

ChatSession
  └── ChatMessage[]

PersistedUser
  └── User

PersistedProgress
  └── LessonProgress[]

PersistedChat
  └── ChatSession[]
```

## Validation Best Practices

1. **Always validate at boundaries**: API, storage, state
2. **Use `.safeParse()` for user input**: Handle errors gracefully
3. **Use `.parse()` for internal data**: Fail fast on corruption
4. **Version persisted schemas**: Include `version` field for migrations
5. **Provide defaults**: Use `.default()` for optional fields
6. **Compose schemas**: Build complex schemas from simpler ones
7. **Export types**: Use `z.infer<typeof Schema>` for TypeScript types
8. **Document constraints**: Add `.describe()` for clarity

## Migration Strategy

When schemas change:

1. **Increment version number** in persisted schemas
2. **Write migration function** to transform old data
3. **Handle both versions** during transition period
4. **Clean up old versions** after migration window

```typescript
// Example migration
function migrateUser(raw: unknown): User | null {
  const versionCheck = z.object({ version: z.number() }).safeParse(raw);
  
  if (!versionCheck.success) return null;
  
  switch (versionCheck.data.version) {
    case 1:
      return PersistedUserSchema.parse(raw).data;
    case 2:
      // Transform v2 to current format
      return migrateV2ToV3(raw);
    default:
      return null;
  }
}
```

## Testing Schemas

```typescript
// schemas/__tests__/lesson.schema.test.ts
import { LessonSchema, ExerciseSchema } from '../lesson.schema';

describe('LessonSchema', () => {
  it('validates a valid lesson', () => {
    const lesson = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Spanish Basics',
      language: 'es',
      level: 'beginner',
      exercises: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          type: 'mcq',
          prompt: 'What is "hello" in Spanish?',
          options: ['Hola', 'Adiós', 'Gracias'],
          answer: 'Hola',
          xpReward: 10,
        },
      ],
      xpReward: 50,
      createdAt: Date.now(),
    };
    
    const result = LessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
  });
  
  it('rejects lesson with invalid language code', () => {
    const lesson = { /* ... */ language: 'invalid' };
    const result = LessonSchema.safeParse(lesson);
    expect(result.success).toBe(false);
  });
});
```

## Summary

- All schemas in `/schemas` with barrel export
- Validate at all boundaries (API, storage, state)
- Use `z.infer<typeof Schema>` for TypeScript types
- Version persisted schemas for migrations
- Compose complex schemas from simpler ones
- Test schemas thoroughly
- Document constraints and relationships
