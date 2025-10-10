#!/usr/bin/env python3
import re

# Read the file
with open('.github/workflows/backend-ci.yml', 'r') as f:
    content = f.read()

# Remove duplicate 'with:' blocks
# Pattern: with:\n          fetch-depth: 0\n        with:\n          fetch-depth: 0
pattern = r'(\s+with:\s*\n\s+fetch-depth:\s*0)\s*\n\s+with:\s*\n\s+fetch-depth:\s*0'
content = re.sub(pattern, r'\1', content)

# Write back
with open('.github/workflows/backend-ci.yml', 'w') as f:
    f.write(content)

print("Fixed duplicate 'with' blocks")
