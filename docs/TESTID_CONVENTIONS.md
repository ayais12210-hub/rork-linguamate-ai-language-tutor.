# TestID Conventions

This document outlines the testID naming conventions for Linguamate to ensure consistent and maintainable E2E and integration tests.

## Naming Pattern

Use kebab-case with descriptive, hierarchical names:

```
{screen}-{component}-{element}
```

## Critical TestIDs

### Navigation & Tabs
- `learn-tab` - Learn tab button
- `lessons-tab` - Lessons tab button
- `modules-tab` - Modules tab button
- `chat-tab` - Chat tab button
- `profile-tab` - Profile tab button
- `leaderboard-tab` - Leaderboard tab button
- `translator-tab` - Translator tab button

### Learn Screen
- `learn-surface` - Main learn screen container
- `learn-alphabet-section` - Alphabet learning section
- `learn-phonics-section` - Phonics training section
- `learn-grammar-section` - Grammar section
- `learn-dialogue-section` - Dialogue practice section
- `learn-character-card` - Individual character card
- `learn-play-audio` - Play pronunciation button
- `learn-next-button` - Next exercise button
- `learn-submit-button` - Submit answer button

### Lessons Screen
- `lessons-list` - Main lessons list container
- `lessons-filter` - Filter dropdown/button
- `lessons-search` - Search input
- `lesson-card-{id}` - Individual lesson card
- `lesson-start-button` - Start lesson button
- `lesson-progress-bar` - Lesson progress indicator
- `lesson-xp-badge` - XP reward badge

### Modules Screen
- `modules-grid` - Modules grid container
- `module-card-{type}` - Module card (alphabet, vowels, consonants, etc.)
- `module-locked-badge` - Locked module indicator
- `module-progress-badge` - Module progress indicator

### Profile Screen
- `profile-avatar` - User avatar
- `profile-username` - Username display
- `profile-xp-total` - Total XP display
- `profile-level-badge` - User level badge
- `profile-streak-counter` - Streak counter
- `profile-stats-section` - Statistics section
- `profile-achievements-list` - Achievements list
- `profile-edit-button` - Edit profile button
- `profile-settings-button` - Settings button

### Chat Screen
- `chat-input` - Message input field
- `chat-send-button` - Send message button
- `chat-messages-list` - Messages list container
- `chat-message-{id}` - Individual message
- `chat-clear-button` - Clear conversation button

### Leaderboard Screen
- `leaderboard-list` - Leaderboard list container
- `leaderboard-filter` - Time period filter
- `leaderboard-user-rank` - Current user's rank
- `leaderboard-item-{rank}` - Individual leaderboard entry

### Auth Screens
- `auth-email-input` - Email input field
- `auth-password-input` - Password input field
- `auth-login-button` - Login button
- `auth-signup-button` - Sign up button
- `auth-forgot-password-link` - Forgot password link
- `auth-social-google` - Google sign-in button
- `auth-social-facebook` - Facebook sign-in button

### Common Components
- `modal-overlay` - Modal backdrop
- `modal-close-button` - Modal close button
- `loading-spinner` - Loading indicator
- `error-message` - Error message display
- `success-message` - Success message display
- `back-button` - Back navigation button
- `menu-button` - Menu/hamburger button

## Usage in Components

### React Native

```tsx
<View testID="learn-surface">
  <TouchableOpacity testID="learn-play-audio">
    <Text>Play</Text>
  </TouchableOpacity>
</View>
```

### React Native Web

TestIDs automatically map to `data-testid` attributes in web:

```tsx
<View testID="lessons-list">
  {/* Becomes <div data-testid="lessons-list"> in web */}
</View>
```

## Testing with TestIDs

### Jest + React Testing Library

```tsx
import { render, screen } from '@testing-library/react';

const { getByTestId } = render(<LearnScreen />);
expect(getByTestId('learn-surface')).toBeTruthy();

// Or with screen
expect(screen.getByTestId('learn-play-audio')).toBeTruthy();
```

### Playwright

```ts
await page.getByTestId('lessons-list').waitFor();
await page.getByTestId('lesson-start-button').click();
```

## Best Practices

1. **Be Specific**: Use descriptive names that clearly identify the element
2. **Be Consistent**: Follow the `{screen}-{component}-{element}` pattern
3. **Avoid Duplication**: Each testID should be unique within a screen
4. **Use Dynamic IDs**: For lists, append unique identifiers (e.g., `lesson-card-${id}`)
5. **Document New IDs**: Add new testIDs to this document when creating them
6. **Accessibility First**: Prefer semantic roles and labels when possible, use testIDs as fallback

## Accessibility Considerations

Always pair testIDs with proper accessibility props:

```tsx
<TouchableOpacity
  testID="learn-play-audio"
  accessibilityRole="button"
  accessibilityLabel="Play pronunciation"
  accessibilityHint="Plays the audio pronunciation of the character"
>
  <Play />
</TouchableOpacity>
```

## Migration Strategy

When adding testIDs to existing components:

1. Start with critical user flows (auth, main navigation, core features)
2. Add testIDs to list containers before individual items
3. Prioritize interactive elements (buttons, inputs, links)
4. Update E2E tests to use new testIDs
5. Remove brittle selectors (text content, class names)
