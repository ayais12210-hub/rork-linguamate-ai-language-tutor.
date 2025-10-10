# React 19 Compatibility Fix for Expo Router

## Problem
The error `(0, react_1.use) is not a function` occurs when using expo-router with React 19. This happens because expo-router tries to use the React 19 `use` hook, but it's not being imported correctly.

## Root Cause
- expo-router 5.0.7 is not fully compatible with React 19.2.0
- The `use` hook is a React 19 feature, but expo-router is trying to use it in a way that's not working properly
- The issue is in `node_modules/expo-router/build/global-state/storeContext.js` where it uses `react_1.use` instead of `react_1.useContext`

## Solution
This fix includes several components:

### 1. Automatic Patch Script
- `scripts/fix-react19-compatibility.sh` - Automatically applies the fix after npm install
- Replaces `react_1.use` with `react_1.useContext` in the expo-router store context
- Creates a backup of the original file
- Verifies the fix was applied correctly

### 2. Compatibility Layer
- `lib/expo-router-compat.ts` - Provides a compatibility layer for React 19
- Creates a compatible context and hook that works with React 19
- Can be used as a fallback if the patch doesn't work

### 3. Postinstall Hook
- Added to `package.json` to automatically apply the fix after `npm install`
- Ensures the fix is applied every time dependencies are installed

## Usage
The fix is applied automatically when you run:
```bash
npm install
```

Or you can run it manually:
```bash
bash scripts/fix-react19-compatibility.sh
```

## Files Modified
- `package.json` - Added postinstall script
- `scripts/fix-react19-compatibility.sh` - Created fix script
- `lib/expo-router-compat.ts` - Created compatibility layer
- `app/_layout.tsx` - Added compatibility layer import

## Verification
After applying the fix, the error `(0, react_1.use) is not a function` should be resolved and expo-router should work properly with React 19.

## Backup
The original file is backed up as `node_modules/expo-router/build/global-state/storeContext.js.backup` before applying the fix.

## Rollback
If you need to rollback the fix:
```bash
mv node_modules/expo-router/build/global-state/storeContext.js.backup node_modules/expo-router/build/global-state/storeContext.js
```