# Bug Fixes Summary

This document summarizes critical bugs found and fixed in the codebase, prioritized by severity.

## Critical Bugs Fixed (High Priority)

### 1. **Audio Blob Type Mismatch** ✅ FIXED
**File:** `lib/audio.ts` (line 88)
**Severity:** CRITICAL
**Description:** The `WebAudioRecorder.stopRecording()` method was hardcoding the blob MIME type as `'audio/wav'` instead of using the actual `mediaRecorder.mimeType`. This could cause issues when the browser doesn't support WAV format and uses a different codec.
**Impact:** Audio transcription failures, corrupted audio data
**Fix:** Changed to dynamically use the actual MIME type from the MediaRecorder.

```typescript
// Before:
const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

// After:
const mimeType = this.mediaRecorder?.mimeType || 'audio/wav';
const audioBlob = new Blob(this.audioChunks, { type: mimeType });
```

### 2. **Permission Race Condition** ✅ FIXED
**File:** `hooks/use-speech.ts` (lines 156-161)
**Severity:** CRITICAL
**Description:** The `startRecording` function had a race condition where it would check `audioPermission` state after calling `requestAudioPermission()`, but the state might not have updated yet due to React's asynchronous state updates.
**Impact:** Recording could fail silently even when permission is granted
**Fix:** Modified `requestAudioPermission` to return a boolean, eliminating the race condition.

```typescript
// Before:
if (!audioPermission) {
  await requestAudioPermission();
  if (!audioPermission) return; // Stale state!
}

// After:
if (!audioPermission) {
  const granted = await requestAudioPermission();
  if (!granted) return; // Fresh result!
}
```

### 3. **State Closure Bug in Dialogue FSM** ✅ FIXED
**File:** `modules/dialogue/logic/fsm.ts` (lines 111-136)
**Severity:** CRITICAL
**Description:** The `useDialogueFSM` hook had a critical bug where the `ctx` object was recreated on every render and included in the `useCallback` dependency array. This caused:
- The `dispatch` callback to be recreated on every render
- Stale state issues where the callback captured old state values
- Unnecessary re-renders of child components
**Impact:** Incorrect dialogue state transitions, performance degradation
**Fix:** Used `useRef` to track latest state values without triggering re-renders.

## High Priority Bugs Fixed

### 4. **Filename Generation Typo** ✅ FIXED
**File:** `hooks/use-speech.ts` (line 318)
**Severity:** HIGH
**Description:** Extra space in template literal: `` `recording.${extension}` `` instead of `` `recording.${extension}` ``
**Impact:** Malformed filenames in audio file uploads
**Fix:** Removed extra space from template literal.

### 5. **Memory Leak in Timeout Cleanup** ✅ FIXED
**File:** `hooks/use-speech.ts` (lines 129-131)
**Severity:** HIGH
**Description:** The `speak` function created a timeout but didn't provide a way to clean it up on unmount.
**Impact:** Potential state updates on unmounted components, memory leaks
**Fix:** Returned a cleanup function from `speak` to clear the timeout.

### 6. **Memory Leak in PhonicsTrainer** ✅ FIXED
**File:** `components/PhonicsTrainer.tsx` (line 75)
**Severity:** HIGH
**Description:** The `onChoose` callback used `setTimeout` without cleanup, causing state updates on unmounted components.
**Impact:** React warnings, memory leaks, potential crashes
**Fix:** Added `useRef` to track timeout and cleanup in `useEffect`.

### 7. **Type Safety Issue in API Client** ✅ FIXED
**File:** `lib/api.ts` (line 118)
**Severity:** MEDIUM
**Description:** Using `as unknown as number` cast for `clearTimeout` due to type mismatch between Node.js and browser timer types.
**Impact:** Type safety issues, potential runtime errors
**Fix:** Properly typed the timeout ID as `ReturnType<typeof setTimeout>`.

## Summary Statistics

- **Total Bugs Fixed:** 7
- **Critical Bugs:** 3
- **High Priority Bugs:** 3
- **Medium Priority Bugs:** 1
- **Files Modified:** 5

## Bug Categories

### Memory Leaks (3 bugs)
- Timeout cleanup issues in multiple components
- Stale closures in hooks

### Race Conditions (2 bugs)
- Permission request state synchronization
- State closure in FSM

### Type Safety (1 bug)
- Timeout type casting

### Data Integrity (1 bug)
- Audio blob MIME type mismatch

## Recommendations for Future Development

1. **Add ESLint Rules:**
   - Enable `react-hooks/exhaustive-deps` to catch dependency array issues
   - Add rules to detect missing cleanup in effects
   - Enable strict TypeScript mode

2. **Testing:**
   - Add unit tests for all fixed components
   - Add integration tests for audio recording flow
   - Add tests for permission handling

3. **Code Review Checklist:**
   - Always clean up timers in useEffect cleanup functions
   - Avoid creating objects in dependency arrays
   - Use functional setState when depending on previous state
   - Properly type browser/Node.js APIs

4. **Monitoring:**
   - Add error tracking for audio recording failures
   - Monitor permission denial rates
   - Track component unmount errors

## Notes

- The password hashing in `backend/trpc/routes/auth/auth.ts` uses a simple hash and is marked as "demo" - this should be replaced with bcrypt in production
- All setTimeout/setInterval usage should be audited for proper cleanup
- Consider using a custom hook for timer management to enforce cleanup patterns
