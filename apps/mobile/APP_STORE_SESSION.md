# iOS App Store Submission - Session State (Feb 12-13, 2026)

## Completed

- Version bumped to 1.0.0 in apps/mobile/app.json
- App Store description rewritten honestly in appstore-description.txt (removed false claims about voice logging, timer, recurring activities, photo attachments, 50-state compliance, PDF export)
- Updated short-description.txt and metadata.json keywords
- Created privacy.html, terms.html, support.html in apps/web/public/
- Created demo data seed script at apps/mobile/src/database/seedDemoData.ts
- Added "Load Demo Data" button in settings, gated by `__DEV__ || EXPO_PUBLIC_DEMO_DATA`
- EXPO_PUBLIC_DEMO_DATA=1 set in eas.json development and preview profiles only
- Fixed crypto.ts PRNG error (polyfilled crypto.getRandomValues for tweetnacl)
- Fixed heartbeat spam in workerSignaling.ts (log once, suppress repeats)
- iPhone screenshots taken, resized to 1284x2778, uploaded to App Store Connect
- iPad screenshots taken on iPad Pro 13" simulator, uploaded
- App Store Connect app created: bundle ID com.scoblelife.homeschool
- Apple ID (ASC_APP_ID): 6759132824, Team ID: 7945DPG23X
- EAS env secrets set for production environment
- App Store Connect metadata filled in

### Feb 13 - Build & Bug Fixes

- **EAS Build fixed**: Root cause was duplicate `package-lock.json` files (root + apps/mobile/) causing EAS to use npm instead of pnpm. Removed both.
- Created `apps/mobile/eas-build-pre-install.sh` (corepack enable + pnpm activation)
- Updated `metro.config.js` for monorepo: added watchFolders and nodeModulesPaths for workspace root
- Updated `.easignore`: added apps/web/ exclusion and package-lock.json glob
- expo-doctor passes 17/17 (react-native-webrtc excluded from New Arch check)
- **newArchEnabled: true** (required — build fails at pod install with it off)
- **Bug fix: tab bar overlapping home indicator** — phone paddingBottom 4→16, height 50→62 in `(tabs)/_layout.tsx`
- **Bug fix: auto-select first student** — added defensive useEffect in `_layout.tsx` that picks first student when selectedStudentId is null or stale
- **Feature: planner auto-suggest** — added "Suggest Focus" button to `(tabs)/planner.tsx` calling `getSuggestedMilestones(15)`, highlights priority milestones with sparkle badge
- Hardcoded Apple credentials in eas.json submit profiles (env vars don't resolve locally)
- **Production build succeeded**: build ec3a1fca-bfcf-4814-8f5f-c1156a057710
- **IPA submitted to App Store Connect** via `eas submit`

## Awaiting

- Apple review of submitted build
- May need new screenshots reflecting bug fixes (tab bar spacing, planner suggest button)

## Key Config

- EAS project ID: 61b79595-640b-4390-9fa0-fe40e8aede5d
- Bundle ID: com.scoblelife.homeschool
- Apple email: punkdgeek@gmail.com
- Support email: support@scoble.life
- Web URL: https://homeschool.scoble.life
- Expo SDK 54, expo-router ~6.0.21
- Push notifications: local only (withLocalNotificationsOnly plugin)
- eas.json: promptToConfigurePushNotifications: false
- newArchEnabled: true (required by react-native-webrtc pods)
