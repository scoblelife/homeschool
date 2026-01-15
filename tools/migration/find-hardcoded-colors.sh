#!/bin/bash
# Find Hardcoded Colors Migration Helper
#
# Searches for hardcoded Tailwind color classes in page components
# that should use design system colors instead.
#
# Usage:
#   bash tools/migration/find-hardcoded-colors.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Finding Hardcoded Colors in Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SEARCH_DIR="src/renderer/src/pages"
FOUND_ISSUES=0

# Function to search for pattern and count matches
search_pattern() {
  local pattern=$1
  local description=$2

  echo "Searching for: $description"
  echo "Pattern: $pattern"
  echo ""

  # Use grep to find matches
  if grep -r -n --include="*.tsx" --include="*.ts" -E "$pattern" "$SEARCH_DIR" 2>/dev/null; then
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
    echo ""
  else
    echo "  ✅ No instances found"
    echo ""
  fi
}

# Background colors (excluding child1/child2 which are allowed)
search_pattern "bg-(fuchsia|teal|blue|orange|purple|green)-[0-9]" \
  "Background colors (bg-fuchsia-500, bg-teal-600, etc.)"

# Text colors
search_pattern "text-(fuchsia|teal|blue|orange|purple|green|amber|red)-[0-9]" \
  "Text colors (text-green-500, text-amber-600, etc.)"

# Border colors
search_pattern "border-(fuchsia|teal|blue|orange|purple|green|amber|red)-[0-9]" \
  "Border colors (border-red-500, etc.)"

# Ring colors (focus rings)
search_pattern "ring-(fuchsia|teal|blue|orange|purple|green|amber|red)-[0-9]" \
  "Ring colors (ring-amber-500, etc.)"

# Status colors that should use design system variants
search_pattern "bg-(green|amber|red)-(50|100|200|300|400|500|600|700|800|900)" \
  "Status background colors (should use Alert/Badge variants)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ No hardcoded colors found!"
  echo ""
  echo "All pages are using design system colors correctly."
else
  echo "⚠️  Found hardcoded colors in $FOUND_ISSUES pattern(s)"
  echo ""
  echo "Recommended actions:"
  echo "  1. Replace status colors with <Alert> or <Badge> components"
  echo "  2. Replace student colors with child1/child2 aliases"
  echo "  3. Use design system color tokens from tailwind-tokens.ts"
  echo ""
  echo "Example migrations:"
  echo "  bg-green-100 text-green-700  →  <Alert variant=\"success\">"
  echo "  bg-amber-100 text-amber-700  →  <Alert variant=\"warning\">"
  echo "  bg-red-100 text-red-700      →  <Alert variant=\"error\">"
  echo "  bg-fuchsia-500               →  bg-child1-500 (if student color)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
