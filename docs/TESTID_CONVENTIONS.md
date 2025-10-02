# TestID Conventions

This document outlines the testID naming conventions used throughout the Linguamate app for UI testing.

## General Rules

1. Use kebab-case for all testIDs
2. Be descriptive and specific
3. Include the component type or purpose
4. Use consistent prefixes for related components

## Onboarding & Language Selection

### Search Components
- `language-search` - Main language search input
- `native-language-search` - Native language search input (Step 1)
- `target-language-search` - Target language search input (Step 2)

### Language Lists
- `language-list` - Generic language list container
- `native-language-list` - Native language list (Step 1)
- `target-language-list` - Target language list (Step 2)
- `language-item-{code}` - Individual language item (e.g., `language-item-en`, `language-item-pa`)

### Onboarding Steps
- `onboarding-next` - Next/Continue button in onboarding

## Screen-Level TestIDs

### Main Screens
- `learn-surface` - Learn screen root container
- `lessons-list` - Lessons list container
- `modules-grid` - Modules grid container
- `chat-input` - Chat input field
- `profile-leaderboard` - Profile leaderboard section

## Accessibility

All testIDs should be accompanied by proper accessibility attributes:
- `accessibilityLabel` - Descriptive label for screen readers
- `accessibilityRole` - Semantic role (button, text, etc.)
- `accessibilityHint` - Additional context when needed

## Examples

```tsx
// Language search bar
<TextInput
  testID="language-search"
  accessibilityLabel="Search languages"
  accessibilityRole="search"
/>

// Language list item
<TouchableOpacity
  testID={`language-item-${lang.code}`}
  accessibilityRole="button"
  accessibilityLabel={`Choose ${lang.name}`}
>
  {/* ... */}
</TouchableOpacity>
```

## Testing

Use these testIDs in your tests:

```typescript
// Find by testID
const searchBar = screen.getByTestId('language-search');

// Find language item
const punjabi = screen.getByTestId('language-item-pa');

// Check list exists
expect(screen.getByTestId('language-list')).toBeTruthy();
```
