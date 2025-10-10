#!/bin/bash

# Script to fix React 19 compatibility issues with expo-router
# This script handles the "use is not a function" error by applying
# the necessary patches and ensuring proper compatibility

echo "🔧 Fixing React 19 compatibility issues with expo-router..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Please run 'npm install' first."
    exit 1
fi

# Check if expo-router is installed
if [ ! -d "node_modules/expo-router" ]; then
    echo "❌ expo-router not found in node_modules. Please run 'npm install' first."
    exit 1
fi

# Target file path
TARGET_FILE="node_modules/expo-router/build/global-state/storeContext.js"

# Check if target file exists
if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ Target file not found: $TARGET_FILE"
    echo "   This might be due to a different expo-router version or build structure."
    exit 1
fi

# Create backup
cp "$TARGET_FILE" "$TARGET_FILE.backup"

# Apply the fix by replacing react_1.use with react_1.useContext
sed -i 's/react_1\.use(/react_1.useContext(/g' "$TARGET_FILE"

# Verify the fix was applied
if grep -q "react_1.useContext" "$TARGET_FILE"; then
    echo "✅ Fix applied successfully!"
    echo "   Replaced react_1.use with react_1.useContext in expo-router store context"
    echo "   Backup created at: $TARGET_FILE.backup"
else
    echo "❌ Fix failed. Restoring backup..."
    mv "$TARGET_FILE.backup" "$TARGET_FILE"
    exit 1
fi

echo "🎉 expo-router is now compatible with React 19!"
echo "   The 'use is not a function' error should be resolved."