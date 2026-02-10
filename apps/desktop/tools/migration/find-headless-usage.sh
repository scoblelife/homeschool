#!/bin/bash
# Find Headless UI Direct Usage Migration Helper
#
# Searches for direct usage of Headless UI components in pages
# that should be wrapped with design system components instead.
#
# Usage:
#   bash tools/migration/find-headless-usage.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Finding Direct Headless UI Usage in Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SEARCH_DIR="src/renderer/src/pages"
FOUND_ISSUES=0

# Function to search for pattern and count matches
search_pattern() {
  local pattern=$1
  local component=$2
  local replacement=$3

  echo "Searching for: <$component ...>"
  echo "Should use: $replacement"
  echo ""

  # Use grep to find matches
  if grep -r -n --include="*.tsx" --include="*.ts" "<$pattern" "$SEARCH_DIR" 2>/dev/null; then
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
    echo ""
  else
    echo "  ✅ No instances found"
    echo ""
  fi
}

# Search for each Headless UI component that has a design system wrapper

search_pattern "Dialog" "Dialog" "<Modal> from design system"

search_pattern "Listbox" "Listbox" "<Select> from design system (TODO: create wrapper)"

search_pattern "Menu" "Menu" "<Dropdown> from design system (TODO: create wrapper)"

search_pattern "Combobox" "Combobox" "<Autocomplete> from design system (TODO: create wrapper)"

search_pattern "Popover" "Popover" "<Popover> from design system (TODO: create wrapper)"

search_pattern "Disclosure" "Disclosure" "<Accordion> from design system (TODO: create wrapper)"

search_pattern "RadioGroup" "RadioGroup" "<Radio> from design system (TODO: create wrapper)"

search_pattern "Switch" "Switch" "<Toggle> from design system (TODO: create wrapper)"

search_pattern "Tab" "Tab" "<Tabs> from design system (TODO: create wrapper)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ No direct Headless UI usage found!"
  echo ""
  echo "All pages are using design system wrappers correctly."
else
  echo "⚠️  Found direct Headless UI usage in $FOUND_ISSUES component type(s)"
  echo ""
  echo "Recommended actions:"
  echo "  1. Replace <Dialog> with <Modal> from @/components/ui"
  echo "  2. For other components, check if design system wrapper exists"
  echo "  3. If wrapper doesn't exist, either:"
  echo "     - Create the wrapper component (preferred)"
  echo "     - Or mark as exception with comment explaining why"
  echo ""
  echo "Example migration:"
  echo "  <Dialog open={isOpen} onClose={setIsOpen}>"
  echo "    <Dialog.Panel>...</Dialog.Panel>"
  echo "  </Dialog>"
  echo ""
  echo "  ↓"
  echo ""
  echo "  <Modal open={isOpen} onClose={setIsOpen}>"
  echo "    ...</Modal>"
  echo "  </Modal>"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
