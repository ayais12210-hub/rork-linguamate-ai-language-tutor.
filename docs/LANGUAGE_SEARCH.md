# Language Search & Filter

This document explains the language search and filtering system used in the onboarding flow.

## Overview

The language search system provides fast, intelligent filtering of 100+ languages with:
- **Debounced search** (200ms) for performance
- **Accent-insensitive matching** (e.g., "espanol" matches "Español")
- **Multi-field search** (ISO code, name, endonym, aliases)
- **Smart ranking** (exact code match > startsWith > substring)
- **Top languages pinned** when search is empty

## Architecture

### Data Layer
**Location:** `modules/languages/data/languages.ts`

```typescript
export type Lang = {
  code: string;           // ISO 639 code (e.g., 'en', 'pa', 'en-GB')
  name: string;           // English name (e.g., 'English', 'Punjabi')
  endonym?: string;       // Native name (e.g., 'ਪੰਜਾਬੀ')
  aliases?: string[];     // Alternative names (e.g., ['British English'])
  flag?: string;          // Emoji flag
};
```

### Filter Logic
**Location:** `modules/languages/logic/filter.ts`

The `rankLanguages(query: string)` function:

1. **Empty query** → Returns top languages first, then alphabetical
2. **With query** → Normalizes and scores each language:
   - ISO code exact match: +100 points
   - Field starts with token: +40 points per token
   - Field contains token: +15 points per token
3. Sorts by score (descending), then alphabetically

**Normalization:**
- Lowercase
- Unicode NFD normalization
- Remove diacritics (accents)

### UI Component
**Location:** `components/search/LanguageSearchBar.tsx`

Features:
- Controlled input with debounced onChange (200ms)
- Clear button (appears when text present)
- Search icon
- Accessibility labels

## Usage in Onboarding

### Step 1: Native Language
```tsx
const [nativeSearchQuery, setNativeSearchQuery] = useState('');
const nativeLanguages = useMemo(
  () => rankLanguages(nativeSearchQuery),
  [nativeSearchQuery]
);

<LanguageSearchBar
  value={nativeSearchQuery}
  onChange={setNativeSearchQuery}
  testID="native-language-search"
/>
```

### Step 2: Target Language
Same pattern, different state variables.

## Performance Optimizations

1. **useMemo** - Filtered list only recomputes when query changes
2. **Debounce** - 200ms delay prevents excessive filtering
3. **Local data** - No network requests
4. **Efficient scoring** - Single pass through languages

## Testing

### Unit Tests
**Location:** `modules/languages/tests/filter.test.ts`

Tests cover:
- Empty query returns top languages
- Exact ISO match ranks highest
- Accent-insensitive matching
- startsWith outranks substring
- Multi-token queries
- Edge cases (special chars, case sensitivity)

### UI Tests
**Location:** `__tests__/onboarding.search.ui.test.tsx`

Tests cover:
- Renders with placeholder
- Displays current value
- Debounced onChange
- Clear button visibility
- Clear button functionality
- Accessibility attributes

## Extending

### Adding Languages
Edit `modules/languages/data/languages.ts`:

```typescript
{
  code: 'new',
  name: 'New Language',
  endonym: 'Native Name',
  flag: '🏳️',
  aliases: ['Alternative Name']
}
```

### Changing Top Languages
Edit `TOP_LANGUAGES` set in `languages.ts`:

```typescript
export const TOP_LANGUAGES = new Set([
  'en', 'es', 'fr', 'de', 'pa', // ... your top languages
]);
```

### Adjusting Debounce
Edit `LanguageSearchBar.tsx`:

```typescript
useEffect(() => {
  const id = setTimeout(() => onChange(draft), 300); // Change 200 to 300
  return () => clearTimeout(id);
}, [draft, onChange]);
```

## Accessibility

All components follow WCAG 2.1 AA standards:
- Minimum 44x44 touch targets
- High contrast text (white on colored backgrounds)
- Descriptive labels for screen readers
- Keyboard navigation support (web)
- RTL layout support

## Web Compatibility

The search system works identically on:
- React Native (iOS/Android)
- React Native Web (browser)

No platform-specific code required.
