# Accessibility Guide

## Overview

Linguamate AI is committed to WCAG 2.1 Level AA compliance, ensuring the app is usable by everyone, including people with disabilities.

## Testing Strategy

### Automated Testing

1. **jest-axe** - Component-level accessibility testing
2. **@axe-core/playwright** - E2E accessibility testing
3. **Lighthouse** - Automated accessibility audits

### Manual Testing

1. **Keyboard Navigation** - Tab through all interactive elements
2. **Screen Readers** - Test with VoiceOver (iOS/macOS), TalkBack (Android), NVDA (Windows)
3. **Color Contrast** - Verify 4.5:1 for normal text, 3:1 for large text
4. **Zoom** - Test at 200% zoom level

## WCAG 2.1 Level AA Requirements

### Perceivable

#### Text Alternatives (1.1.1)
- All images have `alt` text
- Decorative images use `alt=""`
- Icons have `aria-label` or `aria-labelledby`

```tsx
<Image source={logo} alt="Linguamate logo" />
<TouchableOpacity aria-label="Close dialog">
  <X size={24} />
</TouchableOpacity>
```

#### Color Contrast (1.4.3)
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

Use theme colors that meet contrast requirements:
```tsx
const theme = useTheme();
<Text style={{ color: theme.colors.text }}> // Meets 4.5:1
```

#### Resize Text (1.4.4)
- Support 200% zoom without loss of functionality
- Use relative units (rem, em) instead of px
- Test with device accessibility settings

### Operable

#### Keyboard Accessible (2.1.1)
- All functionality available via keyboard
- Logical tab order
- No keyboard traps

```tsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  onPress={handlePress}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

#### Focus Visible (2.4.7)
- Visible focus indicators on all interactive elements
- Use `outline` or `border` styles

```tsx
const styles = StyleSheet.create({
  button: {
    // Focus styles handled by platform
  },
});
```

#### Focus Order (2.4.3)
- Tab order follows visual order
- Use `accessibilityViewIsModal` for modals
- Trap focus within dialogs

```tsx
<Modal
  visible={visible}
  accessibilityViewIsModal={true}
  onRequestClose={onClose}
>
  {/* Focus trapped here */}
</Modal>
```

### Understandable

#### Labels or Instructions (3.3.2)
- All form inputs have labels
- Error messages are clear and actionable

```tsx
<View>
  <Text accessibilityRole="label">Email</Text>
  <TextInput
    accessibilityLabel="Email address"
    accessibilityHint="Enter your email to sign in"
    value={email}
    onChangeText={setEmail}
  />
  {error && (
    <Text accessibilityRole="alert" style={styles.error}>
      {error}
    </Text>
  )}
</View>
```

#### Error Identification (3.3.1)
- Errors announced to screen readers
- Use `accessibilityRole="alert"`

```tsx
{error && (
  <View accessibilityRole="alert" accessibilityLive="assertive">
    <Text style={styles.error}>{error}</Text>
  </View>
)}
```

### Robust

#### Name, Role, Value (4.1.2)
- Use semantic HTML/RN components
- Provide `accessibilityRole` and `accessibilityState`

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  accessibilityLabel="Translate text"
  disabled={isLoading}
>
  <Text>Translate</Text>
</TouchableOpacity>
```

## React Native Accessibility Props

### Core Props

```tsx
accessible={true}                    // Make element accessible
accessibilityLabel="Button label"   // Screen reader text
accessibilityHint="Additional info"  // Extra context
accessibilityRole="button"           // Semantic role
accessibilityState={{                // Current state
  disabled: false,
  selected: true,
  checked: false,
  busy: false,
  expanded: false,
}}
accessibilityValue={{                // Current value
  min: 0,
  max: 100,
  now: 50,
  text: "50 percent",
}}
```

### Live Regions

```tsx
accessibilityLive="polite"    // Announce when idle
accessibilityLive="assertive" // Announce immediately
accessibilityLive="off"       // Don't announce
```

### Modal Behavior

```tsx
accessibilityViewIsModal={true}  // Trap focus in modal
```

## Common Patterns

### Buttons

```tsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit"
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### Form Inputs

```tsx
<View>
  <Text accessibilityRole="label" nativeID="email-label">
    Email
  </Text>
  <TextInput
    accessibilityLabel="Email address"
    accessibilityLabelledBy="email-label"
    accessibilityHint="Enter your email"
    value={email}
    onChangeText={setEmail}
  />
</View>
```

### Lists

```tsx
<FlatList
  data={items}
  accessibilityRole="list"
  renderItem={({ item }) => (
    <View accessibilityRole="listitem">
      <Text>{item.title}</Text>
    </View>
  )}
/>
```

### Tabs

```tsx
<TouchableOpacity
  accessibilityRole="tab"
  accessibilityState={{ selected: isActive }}
  onPress={() => setActiveTab(tab)}
>
  <Text>{tab.label}</Text>
</TouchableOpacity>
```

### Loading States

```tsx
{isLoading && (
  <View
    accessibilityRole="progressbar"
    accessibilityLabel="Loading content"
    accessibilityLive="polite"
  >
    <ActivityIndicator />
  </View>
)}
```

### Alerts

```tsx
<View
  accessibilityRole="alert"
  accessibilityLive="assertive"
>
  <Text>Translation complete</Text>
</View>
```

## Testing Checklist

### Automated Tests

- [ ] Run `bun run a11y` before each PR
- [ ] Zero serious/critical axe violations
- [ ] Lighthouse accessibility score ≥90

### Manual Tests

- [ ] Keyboard navigation works for all features
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] App works at 200% zoom
- [ ] Forms have clear labels and error messages
- [ ] Modals trap focus correctly
- [ ] Live regions announce dynamic content

### Platform-Specific

#### iOS (VoiceOver)
- [ ] Swipe gestures navigate correctly
- [ ] Double-tap activates elements
- [ ] Rotor works for headings, links, form controls

#### Android (TalkBack)
- [ ] Swipe gestures navigate correctly
- [ ] Double-tap activates elements
- [ ] Local context menu works

#### Web
- [ ] Tab key navigates in logical order
- [ ] Enter/Space activate buttons
- [ ] Arrow keys work in custom controls
- [ ] Screen reader (NVDA/JAWS) announces correctly

## Common Issues and Fixes

### Issue: Missing Labels

**Problem:** Screen reader says "Button" without context

**Fix:**
```tsx
// Before
<TouchableOpacity onPress={handleClose}>
  <X size={24} />
</TouchableOpacity>

// After
<TouchableOpacity
  accessibilityLabel="Close dialog"
  onPress={handleClose}
>
  <X size={24} />
</TouchableOpacity>
```

### Issue: Poor Color Contrast

**Problem:** Text is hard to read

**Fix:**
```tsx
// Before
<Text style={{ color: '#999' }}>Low contrast text</Text>

// After
<Text style={{ color: theme.colors.text }}>High contrast text</Text>
```

### Issue: Keyboard Trap

**Problem:** Can't tab out of modal

**Fix:**
```tsx
<Modal
  visible={visible}
  accessibilityViewIsModal={true}
  onRequestClose={onClose}
>
  {/* Content */}
  <TouchableOpacity
    accessibilityLabel="Close"
    onPress={onClose}
  >
    <X />
  </TouchableOpacity>
</Modal>
```

### Issue: Dynamic Content Not Announced

**Problem:** Translation result appears but screen reader doesn't announce

**Fix:**
```tsx
{translation && (
  <View
    accessibilityRole="alert"
    accessibilityLive="polite"
  >
    <Text>{translation}</Text>
  </View>
)}
```

## Resources

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [iOS VoiceOver Guide](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
- [Android TalkBack Guide](https://support.google.com/accessibility/android/answer/6283677)

---

*Last updated: 2025-01-03*
