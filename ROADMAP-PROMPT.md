# Homeschool App Roadmap v2: Ship, Polish, Delight

You are implementing the next evolution of a homeschool management app. The core features are complete. Now focus on shipping to users, polishing the mobile experience, and adding AI-powered insights.

## How to Work

1. Check the `## Progress Tracker` section below to see what's done
2. Find the next incomplete task (marked with `[ ]`)
3. Implement it fully (code, tests, UI if needed)
4. Mark it complete by changing `[ ]` to `[x]`
5. Commit your changes with a descriptive message
6. Continue to the next task

When ALL tasks across ALL phases are marked `[x]`, output:
```
<promise>ROADMAP V2 COMPLETE</promise>
```

## Technical Context

- **Desktop**: Electron + React + TypeScript + DuckDB
- **Mobile**: React Native + Expo + SQLite
- **Sync**: WebRTC P2P with Cloudflare Worker signaling
- **State**: Zustand
- **Styling**: Tailwind CSS (desktop), custom components (mobile)
- **CI/CD**: GitHub Actions, EAS Build
- **Infrastructure**: Cloudflare Workers (signaling), Cloudflare Pages (docs)

## Progress Tracker

---

### Phase 6: Ship & Learn

**Goal:** Get the app into real users' hands and establish feedback loops.

- [ ] **6.1 App Store metadata**
  - Write compelling App Store description (iOS)
  - Write Google Play Store description
  - Create app screenshots (phone + tablet sizes)
  - Design app icon variants (all required sizes)
  - Prepare privacy policy URL (already at /privacy)
  - Prepare support URL
  - Location: `mobile/assets/store/`, update `app.json`

- [ ] **6.2 Onboarding flow**
  - First-launch welcome screens (3-4 slides)
  - Explain core value prop: "Log learning in seconds"
  - Quick student setup wizard
  - State selection for compliance
  - Optional: import from other apps
  - Location: `mobile/app/onboarding/`

- [ ] **6.3 Analytics instrumentation**
  - Add privacy-respecting analytics (Plausible or self-hosted)
  - Track key events: app_open, activity_logged, report_generated
  - Track feature usage without PII
  - User can opt-out in settings
  - Location: `mobile/src/analytics/`, `src/renderer/src/analytics/`

- [ ] **6.4 Crash reporting**
  - Integrate Sentry or Bugsnag (mobile + desktop)
  - Capture JS errors with stack traces
  - Capture native crashes
  - Breadcrumb trail for debugging
  - User can opt-out in settings
  - Location: `mobile/src/errorReporting/`, `src/errorReporting/`

- [ ] **6.5 In-app feedback**
  - "Send Feedback" button in settings
  - Simple form: category (bug/feature/other) + description
  - Optional screenshot attachment
  - Send via email or GitHub issue API
  - Location: `mobile/src/components/Feedback.tsx`, `src/renderer/src/components/Feedback.tsx`

- [ ] **6.6 Performance profiling**
  - Measure app launch time (target: <2s cold start)
  - Measure time to interactive on each screen
  - Profile database queries (identify slow ones)
  - Monitor memory usage during sync
  - Add performance marks to key operations
  - Location: `mobile/src/performance/`, `src/performance/`

- [ ] **6.7 Accessibility audit**
  - Add accessibility labels to all interactive elements
  - Test with VoiceOver (iOS) and TalkBack (Android)
  - Ensure Dynamic Type support (iOS)
  - Ensure font scaling (Android)
  - Color contrast check (WCAG AA minimum)
  - Keyboard navigation (desktop)
  - Location: Update components throughout

- [ ] **6.8 TestFlight submission**
  - Configure EAS Submit for iOS
  - Set up App Store Connect app record
  - Submit first TestFlight build
  - Document beta tester onboarding process
  - Location: `mobile/eas.json`, docs

- [ ] **6.9 Play Store internal testing**
  - Configure EAS Submit for Android
  - Set up Google Play Console app record
  - Submit to internal testing track
  - Document beta tester onboarding process
  - Location: `mobile/eas.json`, docs

---

### Phase 7: Mobile-First Polish

**Goal:** Make mobile the best way to log daily activities.

- [ ] **7.1 Push notifications**
  - Set up Expo Notifications
  - Daily reminder: "Don't forget to log today's activities"
  - Streak warning: "Log today to keep your 7-day streak!"
  - Configurable notification time in settings
  - Respect Do Not Disturb / Focus modes
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

- [ ] **7.6 Offline resilience**
  - Queue all writes when offline
  - Show clear offline indicator
  - Sync automatically when connection restored
  - Handle conflict resolution gracefully
  - Never lose user data
  - Location: `mobile/src/sync/offlineQueue.ts`

- [ ] **7.7 Quick actions (3D Touch / long press)**
  - App icon quick actions: "Log Activity", "Start Timer", "View Today"
  - Implement for both iOS and Android
  - Location: `mobile/app.json` (expo-quick-actions)

- [ ] **7.8 Haptic feedback**
  - Add haptics on activity logged (success)
  - Haptics on timer start/stop
  - Haptics on streak milestone
  - Subtle, not annoying
  - Location: Throughout mobile components

- [ ] **7.9 Dark mode**
  - Respect system dark mode preference
  - Manual toggle in settings
  - Ensure all screens look good in dark mode
  - Test contrast ratios
  - Location: `mobile/src/theme/`, update all components

- [ ] **7.10 Tablet optimization**
  - iPad split-view support
  - Android tablet layouts
  - Master-detail navigation on larger screens
  - Optimize for landscape orientation
  - Location: `mobile/src/layouts/`

---

### Phase 8: AI-Powered Insights

**Goal:** Transform logged data into actionable guidance.

- [ ] **8.1 AI infrastructure**
  - Add Claude API integration (or OpenAI fallback)
  - Create serverless function for AI calls (Cloudflare Worker)
  - Handle API keys securely (user provides own or use app key)
  - Rate limiting and cost management
  - Location: `worker/src/ai.ts`, `src/ai/`

- [ ] **8.2 Weekly AI summary**
  - Analyze week's activities per child
  - Generate 2-3 paragraph narrative summary
  - Highlight: achievements, patterns, suggestions
  - Tone: encouraging, specific, actionable
  - Display in Weekly Summary page
  - Location: `src/renderer/src/features/aiInsights/WeeklySummary.tsx`

- [ ] **8.3 Activity suggestions**
  - Analyze recent activity history
  - Suggest activities for underrepresented subjects
  - "You haven't done science in 2 weeks. Try: [specific ideas]"
  - Show on dashboard
  - Location: `src/renderer/src/features/aiInsights/Suggestions.tsx`

- [ ] **8.4 Portfolio narrative generation**
  - Select date range and child
  - Generate prose summary suitable for evaluators
  - Include: subjects covered, projects completed, growth areas
  - Export as section in portfolio PDF
  - Location: `src/features/portfolio/narrativeGenerator.ts`

- [ ] **8.5 Learning pattern detection**
  - Analyze time-of-day effectiveness
  - Detect subject affinities and challenges
  - Identify optimal session lengths per child
  - "Emma focuses best in morning sessions (avg 45 min)"
  - Location: `src/renderer/src/features/aiInsights/Patterns.tsx`

- [ ] **8.6 Predictive compliance tracking**
  - Based on current pace, predict year-end hours
  - Warn if falling behind requirements
  - "At current pace, you'll have 850/1000 required hours by June"
  - Suggest adjustments
  - Location: `src/renderer/src/features/aiInsights/Predictions.tsx`

- [ ] **8.7 Smart activity categorization**
  - AI auto-suggests subject based on activity description
  - Learn from user corrections
  - "Building Legos" → suggests "Math" (spatial reasoning)
  - Location: `src/renderer/src/features/aiInsights/Categorization.tsx`

- [ ] **8.8 Conversational logging**
  - Chat interface for logging: "We did math worksheets and read for an hour"
  - AI parses into structured activities
  - User confirms before saving
  - Location: `src/renderer/src/features/aiInsights/ChatLogger.tsx`

---

### Phase 9: Community Network

**Goal:** Connect homeschool families via P2P networking.

- [ ] **9.1 Co-op networking**
  - Co-op groups with P2P sync
  - Selective sharing preferences
  - Group member management
  - WebRTC P2P communication
  - Location: `src/renderer/src/features/coop/`

- [ ] **9.2 Field trip discovery**
  - Browse field trips from co-op members
  - Filter by location, date, age group
  - Request to join a field trip
  - Location: `src/renderer/src/features/fieldTrips/Discovery.tsx`

- [ ] **9.3 Resource sharing**
  - Share activity templates with co-op
  - Rate and review shared templates
  - Curriculum reviews from community
  - Location: `src/renderer/src/features/community/`

- [ ] **9.4 Mentor matching**
  - Experienced homeschoolers opt-in as mentors
  - New families can request mentorship
  - In-app messaging (or external contact)
  - Location: `src/renderer/src/features/mentorship/`

---

### Phase 10: Compliance Automation

**Goal:** Make state reporting effortless.

- [ ] **10.1 Document template engine**
  - Create fillable PDF templates for common forms
  - Notice of Intent templates (per state)
  - Annual assessment forms
  - Auto-fill from app data
  - Location: `src/features/compliance/templates/`

- [ ] **10.2 State-specific form generation**
  - Generate state-required forms automatically
  - Support top 10 homeschool states first
  - Include: CA, TX, FL, NY, PA, NC, OH, GA, VA, MI
  - Location: `src/features/compliance/stateforms/`

- [ ] **10.3 Filing deadline reminders**
  - Know filing deadlines per state
  - Push notification 30 days before deadline
  - Email reminder option
  - Calendar integration
  - Location: `src/features/compliance/deadlines.ts`

- [ ] **10.4 Assessment tracking**
  - Track required assessments (standardized tests, evaluations)
  - Schedule assessment appointments
  - Store assessment results
  - Include in portfolio/reports
  - Location: `src/renderer/src/features/assessments/`

- [ ] **10.5 Umbrella school integration**
  - Support reporting to umbrella schools / cover schools
  - Generate reports in their required format
  - Track umbrella school requirements
  - Location: `src/features/compliance/umbrella/`

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

**Last Updated:** 2026-01-11

**Current Phase:** 6
**Current Task:** 6.1
**Blockers:** None

---

When every task above shows `[x]`, output:
```
<promise>ROADMAP V2 COMPLETE</promise>
```
