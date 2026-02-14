#!/bin/bash
# Smoke tests for the landing page at localhost:3000
# Run: bash apps/web/smoke-test.sh

set -euo pipefail

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

check() {
  local description="$1"
  local pattern="$2"
  local source="$3"

  if echo "$source" | grep -q "$pattern"; then
    echo "  PASS: $description"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $description (expected: $pattern)"
    FAIL=$((FAIL + 1))
  fi
}

check_status() {
  local description="$1"
  local url="$2"
  local expected="$3"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "$expected" ]; then
    echo "  PASS: $description ($status)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $description (got $status, expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Fetching $BASE_URL..."
HTML=$(curl -s "$BASE_URL")

echo ""
echo "=== Document Structure ==="
check "Has <html> tag" "<html" "$HTML"
check "Has <head> tag" "<head>" "$HTML"
check "Has <body> tag" "<body>" "$HTML"
check "Has charset meta" 'charSet="utf-8"' "$HTML"
check "Has viewport meta" "viewport" "$HTML"
check "Has <title>" "<title>" "$HTML"

echo ""
echo "=== Favicon ==="
check "Favicon link in HTML" 'favicon-32.png' "$HTML"
check "Apple touch icon link" 'apple-touch-icon' "$HTML"
check_status "favicon-32.png" "$BASE_URL/favicon-32.png" "200"
check_status "favicon-16.png" "$BASE_URL/favicon-16.png" "200"
check_status "apple-touch-icon.png" "$BASE_URL/apple-touch-icon.png" "200"

echo ""
echo "=== CSS / Client Bundle ==="
check "Has stylesheet link" 'rel="stylesheet"' "$HTML"
check "Stylesheet references globals.css" "globals.css" "$HTML"
check "Has script tag (Vite client bundle)" '<script' "$HTML"

echo ""
echo "=== Header ==="
check "Brand name: Homeschool" ">Homeschool</a>" "$HTML"
check "Mastery Group link" "skool.com/homeschool-mastery-group" "$HTML"
check "Privacy link" 'href="/privacy.html"' "$HTML"
check "Terms link" 'href="/terms.html"' "$HTML"
check "Support link" 'href="/support.html"' "$HTML"

echo ""
echo "=== Hero Section ==="
check "Hero headline" "Track your homeschool days without the paperwork" "$HTML"
check "Hero subtitle mentions logging" "Log activities, track progress" "$HTML"
check "NEVCON badge" "NEVCON 2026" "$HTML"
check "Coming Soon label" "Coming Soon" "$HTML"
check "macOS platforms" "Apple Silicon" "$HTML"
check "Windows platforms" "Windows.*Intel.*Arm" "$HTML"
check "Linux platforms" "Linux.*Intel.*Arm" "$HTML"
check "App Store listed" "App Store" "$HTML"
check "Google Play listed" "Google Play" "$HTML"
check "Hero screenshot" 'src="/screenshots/01-today.png"' "$HTML"

echo ""
echo "=== Feature Sections ==="
check "Log activities section" "Log activities in seconds" "$HTML"
check "Log screenshot" 'src="/screenshots/02-log.png"' "$HTML"
check "Progress section" "See their progress at a glance" "$HTML"
check "Progress screenshot" 'src="/screenshots/03-progress.png"' "$HTML"
check "Library section" "Track their reading journey" "$HTML"
check "Library screenshot" 'src="/screenshots/04-library.png"' "$HTML"
check "Milestones section" "Set goals and celebrate wins" "$HTML"
check "Milestones screenshot" 'src="/screenshots/05-milestones.png"' "$HTML"

echo ""
echo "=== NEVCON Section ==="
check "NEVCON heading" "Come see us at NEVCON 2026" "$HTML"
check "NEVCON date" "March 5-7, 2026" "$HTML"
check "NEVCON venue" "Sam.*Town Hotel" "$HTML"
check "NEVCON link" 'href="https://nevcon.org"' "$HTML"
check "Nevada family mention" "Nevada homeschool family" "$HTML"

echo ""
echo "=== Capabilities Section ==="
check "Capabilities heading" "What you can do" "$HTML"
check "Track daily activities" "Track daily activities by subject" "$HTML"
check "Activity types" "worksheets, videos, reading, writing" "$HTML"
check "Milestones capability" "Set and track learning milestones" "$HTML"
check "Offline capability" "Works offline" "$HTML"
check "Nevada compliance" "Nevada homeschool compliance" "$HTML"

echo ""
echo "=== Footer ==="
check "Footer tagline" "Built by a Nevada homeschool family" "$HTML"
check "Footer NEVCON link" "NEVCON" "$HTML"

echo ""
echo "=== Screenshot Assets (HTTP 200) ==="
check_status "01-today.png" "$BASE_URL/screenshots/01-today.png" "200"
check_status "02-log.png" "$BASE_URL/screenshots/02-log.png" "200"
check_status "03-progress.png" "$BASE_URL/screenshots/03-progress.png" "200"
check_status "04-library.png" "$BASE_URL/screenshots/04-library.png" "200"
check_status "05-milestones.png" "$BASE_URL/screenshots/05-milestones.png" "200"

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All smoke tests passed!"
