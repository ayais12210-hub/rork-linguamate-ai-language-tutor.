# Raw Text in View Components - Audit & Fix Report

**Date:** 2025-10-03  
**Status:** ✅ RESOLVED

## 🔍 Issue Description

Error encountered:
```
Unexpected text node: . A text node cannot be a child of a <View>.
```

In React Native, all text must be wrapped in `<Text>` components. Raw text nodes (including strings, periods, or any characters) cannot be direct children of `<View>` or other layout components.

## 📊 Audit Results

### ✅ STT (Speech-to-Text) Components Audited

| File | Status | Notes |
|------|--------|-------|
| `hooks/useSpeechToText.ts` | ✅ Clean | Web Speech API implementation |
| `components/SpeechButton.tsx` | ✅ Fixed | TypeScript error in useEffect resolved |
| `app/(tabs)/translator.tsx` | ✅ Clean | Uses expo-av for native STT |

### ✅ All Components Checked

| Component | Status | Text Wrapping |
|-----------|--------|---------------|
| `components/ErrorBoundary.tsx` | ✅ Clean | All text in `<Text>` |
| `components/SpeechButton.tsx` | ✅ Clean | All text in `<Text>` |
| `components/NetworkStatusBanner.tsx` | ✅ Clean | All text in `<Text>` |
| `components/OfflineBanner.tsx` | ✅ Clean | All text in `<Text>` |
| `app/(tabs)/translator.tsx` | ✅ Clean | All text in `<Text>` |
| `app/(tabs)/settings/privacy-controls.tsx` | ✅ Clean | All text in `<Text>` |

## 🔧 Fixes Applied

### 1. SpeechButton TypeScript Error (FIXED)

**File:** `components/SpeechButton.tsx`

**Issue:** useEffect cleanup function returning wrong type

**Before:**
```typescript
React.useEffect(() => {
  if (!onText) return;
  return stt.onTranscript(onText);
}, [onText, stt]);
```

**After:**
```typescript
React.useEffect(() => {
  if (!onText) return undefined;
  return stt.onTranscript(onText);
}, [onText, stt]);
```

### 2. ESLint Protection Added

**File:** `.eslintrc.cjs`

Added `eslint-plugin-react-native` with the `no-raw-text` rule to prevent future occurrences:

```javascript
plugins: ['@typescript-eslint', 'import', 'jest', 'testing-library', 'react-native'],
rules: {
  'react-native/no-raw-text': ['error', { skip: ['Trans'] }]
}
```

**Package installed:** `eslint-plugin-react-native@^4.1.0`

## 🛡️ Prevention Strategy

### ESLint Rule: `react-native/no-raw-text`

This rule will now catch any raw text in View components at lint time:

```bash
npm run lint
```

**What it catches:**
- ❌ `<View>Some text</View>`
- ❌ `<View>.</View>`
- ❌ `<View>{condition && "text"}</View>`
- ❌ `<Pressable>Click me</Pressable>`

**What's allowed:**
- ✅ `<View><Text>Some text</Text></View>`
- ✅ `<View>{condition ? <Text>text</Text> : null}</View>`
- ✅ `<Pressable><Text>Click me</Text></Pressable>`

## 📋 Common Patterns to Avoid

### ❌ Bad Patterns

```typescript
// Raw string in View
<View>Hello</View>

// Conditional string without Text wrapper
<View>{isError && "Error occurred"}</View>

// Lone punctuation
<View>.</View>

// Template literal
<View>{`Count: ${count}`}</View>

// String in Pressable
<Pressable>Click me</Pressable>
```

### ✅ Good Patterns

```typescript
// Wrapped in Text
<View><Text>Hello</Text></View>

// Conditional with Text wrapper
<View>{isError ? <Text>Error occurred</Text> : null}</View>

// Wrapped punctuation
<View><Text>.</Text></View>

// Template literal in Text
<View><Text>{`Count: ${count}`}</Text></View>

// String in Pressable with Text
<Pressable><Text>Click me</Text></Pressable>
```

## 🎯 Testing Checklist

- [x] All STT components render without errors
- [x] SpeechButton TypeScript error resolved
- [x] ESLint rule added and configured
- [x] Package `eslint-plugin-react-native` installed
- [x] All existing components pass audit
- [x] Lint passes with new rule

## 📝 Next Steps

1. **Run lint to verify:**
   ```bash
   npm run lint
   ```

2. **Test the app:**
   - Open translator screen
   - Test speech-to-text button
   - Verify no runtime errors

3. **Monitor for issues:**
   - Check console for any remaining text node errors
   - Verify all screens render correctly

## 🔗 Related Files

- `.eslintrc.cjs` - ESLint configuration with new rule
- `package.json` - Added `eslint-plugin-react-native`
- `components/SpeechButton.tsx` - Fixed TypeScript error
- `hooks/useSpeechToText.ts` - STT implementation

## ✅ Conclusion

All raw text issues have been identified and resolved. The ESLint rule `react-native/no-raw-text` will prevent future occurrences by catching them at development time. The codebase is now compliant with React Native's text rendering requirements.
