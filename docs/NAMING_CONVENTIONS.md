# Naming Conventions

## File Naming

### General Rules
- **TypeScript Files**: `lowerCamelCase.ts` or `lowerCamelCase.tsx`
- **React Components**: `PascalCase.tsx` (e.g., `LearnScreen.tsx`, `Button.tsx`)
- **Test Files**: `*.test.ts` or `*.test.tsx` (e.g., `flow.test.ts`, `LearnScreen.test.tsx`)
- **Type Definition Files**: `*.types.ts` (e.g., `learn.types.ts`)
- **Barrel Exports**: `index.ts` in every package-like folder
- **Assets**: `snake_case.png` (e.g., `app_icon.png`, `splash_screen.png`)

### Examples

```
✅ Good
modules/learn/ui/LearnScreen.tsx
modules/learn/logic/flow.ts
modules/learn/types/learn.types.ts
modules/learn/tests/flow.test.ts
components/ui/Button.tsx
lib/trpcClient.ts

❌ Bad
modules/learn/ui/learn-screen.tsx
modules/learn/logic/Flow.ts
modules/learn/types/LearnTypes.ts
modules/learn/tests/flow.spec.ts
components/ui/button.tsx
lib/TRPCClient.ts
```

## Component Naming

### React Components
- **PascalCase** for component names
- **Descriptive and specific** (avoid generic names like `Component`, `Container`)
- **Suffix with purpose** when needed (e.g., `Modal`, `Card`, `Screen`)

```typescript
// ✅ Good
export function LearnScreen() { ... }
export function FlashcardCarousel() { ... }
export function PronunciationFeedbackModal() { ... }

// ❌ Bad
export function learn() { ... }
export function Flashcard_Carousel() { ... }
export function Modal() { ... }
```

### Hooks
- **Prefix with `use`**
- **lowerCamelCase**
- **Descriptive of what they return or do**

```typescript
// ✅ Good
export function useLearningSession() { ... }
export function useLearnQueries() { ... }
export function useFlashcardState() { ... }

// ❌ Bad
export function learningSession() { ... }
export function UseLearnQueries() { ... }
export function flashcard() { ... }
```

## Variable Naming

### Constants
- **SCREAMING_SNAKE_CASE** for true constants
- **PascalCase** for constant objects/arrays that are configuration

```typescript
// ✅ Good
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_LANGUAGE = 'en';

const LanguageConfig = {
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', flag: '🇪🇸' },
};

// ❌ Bad
const maxRetries = 3;
const apiBaseUrl = 'https://api.example.com';
const LANGUAGE_CONFIG = { ... };
```

### Variables and Parameters
- **lowerCamelCase**
- **Descriptive and meaningful**
- **Avoid abbreviations** unless widely understood

```typescript
// ✅ Good
const userId = user.id;
const isAuthenticated = !!token;
const learningProgress = calculateProgress(sessions);

function fetchLessonById(lessonId: string) { ... }

// ❌ Bad
const uid = user.id;
const auth = !!token;
const lp = calculateProgress(sessions);

function fetchLesson(id: string) { ... }
```

### Boolean Variables
- **Prefix with `is`, `has`, `should`, `can`**

```typescript
// ✅ Good
const isLoading = true;
const hasError = false;
const shouldRetry = true;
const canEdit = user.role === 'admin';

// ❌ Bad
const loading = true;
const error = false;
const retry = true;
const edit = user.role === 'admin';
```

## Type Naming

### Interfaces and Types
- **PascalCase**
- **Descriptive and specific**
- **Avoid `I` prefix** (not idiomatic in TypeScript)

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

type LearningSession = {
  id: string;
  startTime: Date;
};

type LearnQueryResult = {
  data: LearnPayload;
  isLoading: boolean;
};

// ❌ Bad
interface IUser { ... }
interface user { ... }
type learningSession = { ... };
type Result = { ... };
```

### Enums
- **PascalCase** for enum name
- **PascalCase** for enum members

```typescript
// ✅ Good
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

enum LessonDifficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

// ❌ Bad
enum userRole { ... }
enum LESSON_DIFFICULTY { ... }
enum LessonDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
}
```

## Function Naming

### Regular Functions
- **lowerCamelCase**
- **Verb-based** (describe what they do)
- **Specific and descriptive**

```typescript
// ✅ Good
function calculateScore(answers: Answer[]): number { ... }
function fetchUserProfile(userId: string): Promise<User> { ... }
function validateEmail(email: string): boolean { ... }

// ❌ Bad
function score(answers: Answer[]): number { ... }
function user(userId: string): Promise<User> { ... }
function email(email: string): boolean { ... }
```

### Event Handlers
- **Prefix with `handle` or `on`**

```typescript
// ✅ Good
function handleSubmit(event: FormEvent) { ... }
function handleUserLogin(credentials: Credentials) { ... }
function onLessonComplete(lessonId: string) { ... }

// ❌ Bad
function submit(event: FormEvent) { ... }
function userLogin(credentials: Credentials) { ... }
function lessonComplete(lessonId: string) { ... }
```

## Module and Folder Naming

### Folders
- **lowerCamelCase** for feature folders
- **kebab-case** for multi-word folders (if needed)

```
✅ Good
modules/learn/
modules/lessons/
modules/chat/
components/ui/
components/feedback/

❌ Bad
modules/Learn/
modules/Lessons/
modules/CHAT/
components/UI/
components/feed-back/
```

### Barrel Exports
- Always use `index.ts` for barrel exports
- Export all public API from the folder

```typescript
// modules/learn/ui/index.ts
export { default as LearnScreen } from './LearnScreen';
export { default as Flashcard } from './Flashcard';
export { default as QuizCard } from './QuizCard';

// modules/learn/data/index.ts
export * from './learn.queries';
export * from './learn.mutations';

// modules/learn/index.ts
export * from './ui';
export * from './data';
export * from './logic';
export * from './types';
```

## Test Naming

### Test Files
- **Same name as source file** with `.test.ts` or `.test.tsx` suffix

```
✅ Good
flow.ts → flow.test.ts
LearnScreen.tsx → LearnScreen.test.tsx
learn.queries.ts → learn.queries.test.ts

❌ Bad
flow.ts → flowTest.ts
LearnScreen.tsx → learn-screen.spec.tsx
learn.queries.ts → queries.test.ts
```

### Test Descriptions
- **Descriptive and specific**
- **Use natural language**

```typescript
// ✅ Good
describe('calculateScore', () => {
  it('returns 100 when all answers are correct', () => { ... });
  it('returns 0 when all answers are incorrect', () => { ... });
  it('throws error when answers array is empty', () => { ... });
});

// ❌ Bad
describe('calculateScore', () => {
  it('works', () => { ... });
  it('test 1', () => { ... });
  it('should calculate', () => { ... });
});
```

## TestID Naming

### Format
- **kebab-case**
- **Descriptive and hierarchical**
- **Prefix with feature or component name**

```typescript
// ✅ Good
<View testID="learn-screen">
  <Text testID="learn-title">Master Spanish</Text>
  <TouchableOpacity testID="learn-start-quiz">
    <Text>Start Quiz</Text>
  </TouchableOpacity>
</View>

<View testID="flashcard-carousel">
  <View testID="flashcard-0">...</View>
  <View testID="flashcard-1">...</View>
</View>

// ❌ Bad
<View testID="screen">
<View testID="LearnScreen">
<View testID="learn_screen">
<TouchableOpacity testID="button1">
```

## Import Naming

### Default Imports
- **Match the exported name** when possible

```typescript
// ✅ Good
import LearnScreen from '@modules/learn/ui/LearnScreen';
import Button from '@components/ui/Button';

// ❌ Bad
import Learn from '@modules/learn/ui/LearnScreen';
import Btn from '@components/ui/Button';
```

### Named Imports
- **Use original names** from the module

```typescript
// ✅ Good
import { useLearnQueries, useLearnMutations } from '@modules/learn/data';
import { calculateScore, validateAnswer } from '@modules/learn/logic';

// ❌ Bad
import { useLearnQueries as queries } from '@modules/learn/data';
import { calculateScore as calc } from '@modules/learn/logic';
```

## Summary Checklist

- [ ] Files: `lowerCamelCase.ts` or `PascalCase.tsx` for components
- [ ] Components: `PascalCase`
- [ ] Hooks: `useLowerCamelCase`
- [ ] Variables: `lowerCamelCase`
- [ ] Constants: `SCREAMING_SNAKE_CASE` or `PascalCase` for config
- [ ] Booleans: `is`, `has`, `should`, `can` prefix
- [ ] Types/Interfaces: `PascalCase`, no `I` prefix
- [ ] Functions: `lowerCamelCase`, verb-based
- [ ] Event Handlers: `handle` or `on` prefix
- [ ] Folders: `lowerCamelCase` or `kebab-case`
- [ ] Test Files: `*.test.ts` or `*.test.tsx`
- [ ] TestIDs: `kebab-case`, descriptive
- [ ] Barrel Exports: `index.ts` in every folder
