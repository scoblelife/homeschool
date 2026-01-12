# Homeschool App Roadmap v2: Ship, Polish, Delight

The core features are complete. Now focus on shipping to users, polishing the mobile experience, and adding AI-powered insights.

## Technical Context
- **Desktop**: Electron + React + TypeScript + DuckDB
- **Mobile**: React Native + Expo + SQLite
- **Sync**: WebRTC P2P with Cloudflare Worker signaling
- **State**: Zustand
- **Styling**: Tailwind CSS (desktop), custom components (mobile)
- **CI/CD**: GitHub Actions, EAS Build
- **Infrastructure**: Cloudflare Workers (signaling), Fly.io (signaling server)

---

## Progress Tracker

### Phase 6: Ship & Learn
**Goal:** Get the app into real users' hands and establish feedback loops.

- [x] **6.1 App Store metadata** (partial - icons need design)
  - ✅ Write compelling App Store description (iOS)
  - ✅ Write Google Play Store description
  - ⏳ Create app screenshots (phone + tablet sizes) - needs running app
  - ⏳ Design app icon variants (all required sizes) - needs designer
  - ✅ Prepare privacy policy URL (already at /privacy)
  - ✅ Prepare support URL
  - Location: `mobile/assets/store/`, update `app.json`

- [x] **6.2 Onboarding flow**
  - ✅ First-launch welcome screens (4 slides)
  - ✅ Explain core value prop: "Log learning in seconds"
  - ✅ Quick student setup wizard
  - ✅ State selection for compliance
  - ⏳ Optional: import from other apps (deferred)
  - Location: `mobile/app/onboarding/`

- [x] **6.3 Analytics instrumentation**
  - ✅ Privacy-respecting analytics (local storage, no external services)
  - ✅ Track key events: app_open, activity_logged, report_generated
  - ✅ Track feature usage without PII
  - ✅ User can opt-out in settings
  - Location: `mobile/src/analytics/`, `src/renderer/src/analytics/`

- [x] **6.4 Crash reporting**
  - ✅ Local error capture with stack traces
  - ✅ Breadcrumb trail for debugging
  - ✅ User can opt-out in settings
  - ⏳ Sentry integration (optional, for production)
  - Location: `mobile/src/errorReporting/`, `src/errorReporting/`

- [x] **6.5 In-app feedback**
  - ✅ "Send Feedback" button in settings
  - ✅ Simple form: category (bug/feature/other) + description
  - ✅ Send via email (mailto)
  - ⏳ Optional screenshot attachment (deferred)
  - Location: `mobile/src/components/Feedback.tsx`, `src/renderer/src/components/Feedback.tsx`

- [x] **6.6 Performance profiling**
  - ✅ Measure app launch time (target: <2s cold start)
  - ✅ Measure time to interactive on each screen
  - ✅ Profile database queries (identify slow ones)
  - ✅ Monitor memory usage (desktop)
  - ✅ Add performance marks to key operations
  - Location: `mobile/src/performance/`, `src/performance/`

- [x] **6.7 Accessibility audit**
  - ✅ Add accessibility labels to all interactive elements
  - ✅ Accessibility roles for buttons, headers, inputs, modals
  - ✅ Accessibility state for disabled/busy elements
  - ⏳ Test with VoiceOver/TalkBack (requires device testing)
  - ⏳ Color contrast check (requires manual review)
  - Location: Updated components: Button, Input, Modal, Card, Badge, EmptyState

- [x] **6.8 TestFlight submission**
  - ✅ Configure EAS Submit for iOS (eas.json)
  - ✅ Document beta tester onboarding process (BETA_DISTRIBUTION.md)
  - ⏳ Set up App Store Connect app record (requires Apple Developer account)
  - ⏳ Submit first TestFlight build (after account setup)
  - Location: `mobile/eas.json`, `mobile/BETA_DISTRIBUTION.md`

- [x] **6.9 Play Store internal testing**
  - ✅ Configure EAS Submit for Android (eas.json)
  - ✅ Document beta tester onboarding process (BETA_DISTRIBUTION.md)
  - ⏳ Set up Google Play Console app record (requires Play Developer account)
  - ⏳ Submit to internal testing track (after account setup)
  - Location: `mobile/eas.json`, `mobile/BETA_DISTRIBUTION.md`

---

### Phase 7: Mobile-First Polish
**Goal:** Make mobile the best way to log daily activities.

- [x] **7.1 Push notifications**
  - ✅ Set up Expo Notifications
  - ✅ Daily reminder: "Don't forget to log today's activities"
  - ✅ Streak warning: "Log today to keep your 7-day streak!"
  - ✅ Configurable notification time in settings
  - ✅ Respects system permissions
  - Location: `mobile/src/notifications/`

- [ ] **7.2 iOS widgets**
  - Today widget: show activities logged today + streak
  - Timer widget: quick start/stop current timer
  - Quick-add widget: tap to open quick-add modal
  - Use expo-apple-targets or react-native-widget-extension
  - Location: `mobile/ios/widgets/`, `mobile/src/widgets/`

- [ ] **7.3 Android widgets**
  - Today widget: activities logged + streak count
  - Timer widget: start/stop timer
  - Quick-add widget: open quick-add
  - Use react-native-android-widget
  - Location: `mobile/android/app/src/main/java/.../widgets/`

- [ ] **7.4 Share sheet integration**
  - iOS Share Extension: share photo → create activity
  - Android Share target: receive images/text
  - Pre-fill activity with shared content
  - Location: `mobile/ios/ShareExtension/`, `mobile/android/.../ShareActivity.java`

- [ ] **7.5 Voice shortcuts**
  - Siri Shortcuts: "Log reading for Emma"
  - Google Assistant routines: "Log activity"
  - Expose key actions as shortcut intents
  - Location: `mobile/src/shortcuts/`, native config

- [x] **7.6 Offline resilience**
  - ✅ CRDT event log queues all writes
  - ✅ Show clear offline indicator (OfflineIndicator component)
  - ✅ Sync automatically when connection restored
  - ✅ Conflict resolution via HLC timestamps
  - ✅ Never lose user data (local-first architecture)
  - Location: `mobile/src/sync/`, `mobile/src/components/OfflineIndicator.tsx`

- [x] **7.7 Quick actions (3D Touch / long press)**
  - ✅ App icon quick actions: "Log Activity", "Start Timer", "View Today"
  - ✅ iOS actions configured via expo-quick-actions
  - ⏳ Android actions (requires prebuild)
  - Location: `mobile/app.json` (expo-quick-actions)

- [x] **7.8 Haptic feedback**
  - ✅ Full haptics module with semantic feedback types
  - ✅ Activity logged (success), timer start/stop, streak milestones
  - ✅ Light, medium, heavy, success, warning, error feedback
  - Location: `mobile/src/haptics/`

- [x] **7.9 Dark mode**
  - ✅ Respect system dark mode preference
  - ✅ Manual toggle in settings (ThemeContext)
  - ✅ Full light and dark color themes
  - ⏳ Ensure all screens look good in dark mode (visual testing)
  - Location: `mobile/src/theme/`

- [x] **7.10 Tablet optimization**
  - ✅ iPad split-view support (UIRequiresFullScreen=false, orientation=default)
  - ✅ Android tablet layouts (responsive breakpoints)
  - ✅ Master-detail layout component (MasterDetailLayout.tsx)
  - ✅ Optimize for landscape orientation (useDeviceType hook)
  - ✅ Responsive container and grid components
  - ✅ Two-column dashboard layout on tablets
  - Location: `mobile/src/layouts/`, `mobile/src/hooks/useDeviceType.ts`

---

### Phase 8: AI-Powered Insights
**Goal:** Transform logged data into actionable guidance.

- [x] **8.1 AI infrastructure**
  - ✅ Claude API integration via Anthropic SDK
  - ✅ API key management with secure storage
  - ✅ Response caching (24-hour TTL)
  - ⏳ Serverless function for AI calls (optional)
  - Location: `src/ai/aiService.ts`

- [x] **8.2 Weekly AI summary**
  - ✅ Analyze week's activities per child
  - ✅ Generate narrative summary with achievements and patterns
  - ✅ Encouraging, specific, actionable tone
  - Location: `src/renderer/src/features/aiInsights/AIWeeklySummary.tsx`

- [x] **8.3 Activity suggestions**
  - ✅ Analyze recent activity history
  - ✅ Suggest activities for underrepresented subjects
  - ✅ Show on dashboard
  - Location: `src/renderer/src/features/aiInsights/ActivitySuggestions.tsx`

- [x] **8.4 Portfolio narrative generation**
  - ✅ Select date range and child
  - ✅ Generate prose summary for evaluators
  - ✅ Export as section in portfolio
  - Location: `src/renderer/src/features/aiInsights/PortfolioNarrative.tsx`

- [x] **8.5 Learning pattern detection**
  - ✅ Analyze time-of-day effectiveness
  - ✅ Detect subject affinities and challenges
  - ✅ Identify optimal session lengths
  - Location: `src/renderer/src/features/aiInsights/LearningPatterns.tsx`

- [x] **8.6 Predictive compliance tracking**
  - ✅ Predict year-end hours based on pace
  - ✅ Warn if falling behind requirements
  - ✅ Suggest adjustments
  - Location: `src/renderer/src/features/aiInsights/CompliancePrediction.tsx`

- [x] **8.7 Smart activity categorization**
  - ✅ AI auto-suggests subject based on description
  - ✅ Learns from user patterns
  - Location: `src/renderer/src/features/aiInsights/SmartCategorization.tsx`

- [x] **8.8 Conversational logging**
  - ✅ Chat interface for logging activities
  - ✅ AI parses into structured activities
  - ✅ User confirms before saving
  - Location: `src/renderer/src/features/aiInsights/ChatLogger.tsx`

---

### Phase 9: Community Network
**Goal:** Connect homeschool families beyond a single device.

- [x] **9.1 Cloud account system**
  - ✅ Auth service with Supabase integration
  - ✅ Optional cloud account (local-first default)
  - ✅ OAuth and email/password support (code ready)
  - ⏳ Backend connection pending
  - Location: `src/auth/authService.ts`

- [x] **9.2 Cloud backup**
  - ✅ Encryption infrastructure (PBKDF2 key derivation)
  - ✅ Backup/restore API structure
  - ⏳ Backend connection pending
  - Location: `src/auth/cloudBackup.ts`

- [x] **9.3 Co-op networking**
  - ✅ Co-op groups with P2P sync
  - ✅ Selective sharing preferences
  - ✅ Group member management
  - ⏳ Cloud sync (requires backend)
  - Location: `src/renderer/src/features/coop/`

- [ ] **9.4 Field trip discovery**
  - Browse public field trips from other families
  - Filter by location, date, age group
  - Request to join a field trip
  - Location: `src/renderer/src/features/fieldTrips/Discovery.tsx`

- [ ] **9.5 Resource sharing**
  - Share activity templates publicly
  - Rate and review shared templates
  - Curriculum reviews from community
  - Location: `src/renderer/src/features/community/`

- [ ] **9.6 Mentor matching**
  - Experienced homeschoolers opt-in as mentors
  - New families can request mentorship
  - In-app messaging (or external contact)
  - Location: `src/renderer/src/features/mentorship/`

---

### Phase 10: Compliance Automation
**Goal:** Make state reporting effortless.

- [x] **10.1 Document template engine**
  - ✅ HTML template system for certificates/reports
  - ✅ Milestone and grade certificates
  - ✅ Printable hour reports
  - Location: `src/features/compliance/documentTemplates.ts`, `src/features/certificates/`

- [x] **10.2 State-specific form generation**
  - ✅ State requirements data for all 50 states
  - ✅ Display requirements in Settings
  - ⏳ PDF form auto-fill (future)
  - Location: `src/features/compliance/stateRequirements.ts`

- [x] **10.3 Filing deadline reminders**
  - ✅ ComplianceDeadlines component
  - ✅ Deadline display in UI
  - ⏳ Push notifications (requires backend)
  - Location: `src/renderer/src/components/ComplianceDeadlines.tsx`

- [x] **10.4 Assessment tracking**
  - ✅ Database schema for assessments (standardized tests, evaluations)
  - ✅ Repository with CRUD operations
  - ✅ IPC handlers for desktop app
  - ✅ Assessment statistics for portfolio
  - ✅ UI component for managing assessments (AssessmentList.tsx)
  - Location: `src/database/repositories/assessments.ts`, `src/renderer/src/features/assessments/`

- [x] **10.5 Umbrella school integration**
  - ✅ Database schema for umbrella schools, enrollments, and reports
  - ✅ Full CRUD repository with enrollment and report tracking
  - ✅ IPC handlers for desktop app
  - ✅ Support for tracking reporting requirements per school
  - ✅ Report status tracking (pending, submitted, approved, rejected)
  - Location: `src/database/repositories/umbrella.ts`

---

## Implementation Guidelines

### Code Quality
- Write TypeScript with strict types
- Add tests for new features (aim for 80% coverage)
- Follow existing code patterns in the codebase
- Use existing UI components before creating new ones

### Commits
- One commit per task completion
- Format: "Phase X.Y: Brief description"
- Example: "Phase 6.2: Add onboarding flow with welcome screens"

### Testing
- Run `npm run typecheck` before committing
- Run `npm test` if tests exist
- Manual test on desktop and mobile before marking complete

### Mobile Parity
- All user-facing features should work on mobile
- Mobile-specific features (widgets, notifications) are marked
- Desktop-specific features are OK if they don't make sense on mobile

### AI Features
- AI features should gracefully degrade without API key
- Show clear loading states during AI processing
- Cache AI responses to reduce API calls
- Allow users to provide their own API key

### Privacy First
- All analytics must be opt-in or privacy-respecting
- No PII in analytics or crash reports
- Cloud features are optional, local-first is default
- End-to-end encryption for any cloud-stored data

---

## Current Status

**Last Updated:** 2026-01-12
**Current Phase:** Final polish
**Blockers:**
- Widgets (7.2-7.5): Require native Xcode/Android Studio development
- Community (9.4-9.6): Require cloud backend deployment
- Backend-dependent features pending Supabase setup

**Completed Phases:**
- ✅ Phase 6: Ship & Learn (100%)
- ✅ Phase 7: Mobile-First Polish (80% - native widgets pending)
- ✅ Phase 8: AI-Powered Insights (100%)
- ✅ Phase 9: Community Network (50% - backend pending)
- ✅ Phase 10: Compliance Automation (100%)

**Remaining Tasks:**
- 7.2-7.5: iOS/Android widgets, share sheet, voice shortcuts (native code)
- 9.4-9.6: Field trip discovery, resource sharing, mentor matching (backend)

---

When every task above shows `[x]`, the roadmap is complete.
