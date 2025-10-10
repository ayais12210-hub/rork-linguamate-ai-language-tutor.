#!/bin/bash

# Fix all workflows that use actions/checkout without fetch-depth: 0
echo "Fixing GitHub Actions workflows..."

# Find all workflow files that use actions/checkout
for file in .github/workflows/*.yml; do
    if grep -q "uses: actions/checkout@v" "$file"; then
        echo "Processing: $file"
        
        # Check if fetch-depth is already set
        if ! grep -A 5 "uses: actions/checkout@v" "$file" | grep -q "fetch-depth"; then
            # Add fetch-depth: 0 after checkout actions
            sed -i '/uses: actions\/checkout@v[0-9]/a\        with:\n          fetch-depth: 0' "$file"
            echo "  ✅ Added fetch-depth: 0"
        else
            echo "  ⏭️  Already has fetch-depth configured"
        fi
    fi
done

echo "✅ All workflows processed!"
