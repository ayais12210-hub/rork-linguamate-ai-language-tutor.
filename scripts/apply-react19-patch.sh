#!/bin/bash

# Script to apply React 19 compatibility patch for expo-router
# This fixes the "use is not a function" error by replacing the React 19 'use' hook
# with the React 19 compatible 'useContext' hook

PATCH_FILE="patches/expo-router-react19-compatibility.patch"
TARGET_FILE="node_modules/expo-router/build/global-state/storeContext.js"

echo "🔧 Applying React 19 compatibility patch for expo-router..."

if [ ! -f "$PATCH_FILE" ]; then
    echo "❌ Patch file not found: $PATCH_FILE"
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ Target file not found: $TARGET_FILE"
    echo "   Make sure to run 'npm install' first"
    exit 1
fi

# Apply the patch
if patch -p0 < "$PATCH_FILE"; then
    echo "✅ Patch applied successfully!"
    echo "   Fixed: react_1.use -> react_1.useContext in expo-router store context"
else
    echo "❌ Failed to apply patch"
    exit 1
fi

echo "🎉 expo-router is now compatible with React 19!"