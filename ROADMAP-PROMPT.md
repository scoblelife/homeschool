# Homeschool App Roadmap Implementation

You are implementing a comprehensive roadmap for a homeschool management app. Work through each phase systematically, completing all tasks before moving to the next phase.

## How to Work

1. Check the `## Progress Tracker` section below to see what's done
2. Find the next incomplete task (marked with `[ ]`)
3. Implement it fully (code, tests, UI if needed)
4. Mark it complete by changing `[ ]` to `[x]`
5. Commit your changes with a descriptive message
6. Continue to the next task

When ALL tasks across ALL phases are marked `[x]`, output:
```
<promise>ROADMAP COMPLETE</promise>
```

## Technical Context

- **Desktop**: Electron + React + TypeScript + DuckDB
- **Mobile**: React Native + Expo + SQLite
- **Sync**: WebRTC P2P with Cloudflare Worker signaling
- **State**: Zustand
- **Styling**: Tailwind CSS (desktop), custom components (mobile)

## Progress Tracker

---

### Phase 1: Stabilize Sync

**Goal:** Ensure P2P sync works reliably across real-world conditions.

- [x] **1.1 Multi-device testing harness**
  - Create automated test that simulates 2+ devices
  - Test offer/answer exchange via Worker
  - Test data sync round-trip
  - Location: `src/sync/__tests__/integration.test.ts`

- [x] **1.2 Conflict resolution**
  - Implement last-write-wins with vector clocks
  - Handle same record edited on two devices while offline
  - Add conflict detection logging
  - Location: `src/sync/conflictResolver.ts`

- [x] **1.3 Reconnection handling**
  - Detect network state changes
  - Auto-reconnect with exponential backoff
  - Resume sync from last known state
  - Handle app wake from sleep
  - Location: `src/sync/connectionManager.ts`

- [x] **1.4 Sync status UI**
  - Add sync indicator to header (synced/syncing/offline/error)
  - Show last sync timestamp
  - Show connected peer count
  - Click to see detailed sync status modal
  - Location: `src/renderer/src/components/sync/SyncStatusIndicator.tsx`

- [x] **1.5 Error recovery**
  - Detect corrupted event log
  - Implement event log repair/rebuild
  - Add "Reset Sync" option in settings
  - Graceful degradation when sync fails
  - Location: `src/sync/recovery.ts`

---

### Phase 2: Complete the Core Loop

**Goal:** Make daily activity logging fast and frictionless.

- [x] **2.1 Quick-add component**
  - Floating action button on dashboard
  - Single-tap to log common activities
  - Recent activities as quick buttons
  - Complete logging in <10 seconds
  - Location: `src/renderer/src/components/QuickAdd.tsx`

- [x] **2.2 Voice logging (desktop)**
  - "Add activity" voice command
  - Parse natural language: "30 minutes of reading for Emma"
  - Confirm before saving
  - Location: `src/renderer/src/features/voiceInput/`

- [x] **2.3 Recurring activities**
  - Define recurring activity templates
  - Auto-suggest at scheduled times
  - One-tap to confirm/skip
  - Location: `src/renderer/src/features/recurring/`

- [x] **2.4 Photo attachments**
  - Add photo to any activity
  - Store in `~/.homeschool/attachments/`
  - Thumbnail preview in activity list
  - Full-size view on click
  - Sync photos between devices (compress first)
  - Location: `src/renderer/src/features/attachments/`

- [ ] **2.5 Timer mode**
  - Start/stop timer for sessions
  - Running timer visible in header
  - Auto-save when stopped
  - Persist timer state across app restart
  - Location: `src/renderer/src/features/timer/`

- [ ] **2.6 Mobile quick-add**
  - Port QuickAdd to mobile
  - iOS widget for home screen
  - Android widget for home screen
  - Location: `mobile/src/components/QuickAdd.tsx`

---

### Phase 3: Insights & Motivation

**Goal:** Transform logged data into actionable insights and motivation.

- [ ] **3.1 Weekly summary view**
  - Hours per subject breakdown
  - Activities completed count
  - Comparison to previous week
  - Per-child summary
  - Location: `src/renderer/src/pages/WeeklySummary.tsx`

- [ ] **3.2 Email summaries**
  - Weekly digest email option
  - Configure email in settings
  - Send via SendGrid/Resend (serverless function)
  - Location: `src/features/emailSummary/`

- [ ] **3.3 Streaks and progress**
  - Daily logging streak counter
  - Visual streak display (flame icon)
  - Milestone badges (7-day, 30-day, 100-day)
  - Per-child streak tracking
  - Location: `src/renderer/src/features/streaks/`

- [ ] **3.4 Subject balance alerts**
  - Define target hours per subject
  - Alert when significantly under target
  - Weekly balance visualization
  - Recommendations to rebalance
  - Location: `src/renderer/src/features/balance/`

- [ ] **3.5 Milestone celebrations**
  - Track cumulative achievements (books read, hours logged)
  - Confetti animation on milestones
  - Shareable achievement cards
  - Location: `src/renderer/src/features/milestones/`

- [ ] **3.6 Year-over-year comparison**
  - Compare current year to previous
  - Progress charts over time
  - Export annual report
  - Location: `src/renderer/src/pages/AnnualReport.tsx`

---

### Phase 4: Compliance & Reporting

**Goal:** Support homeschool requirements across different states.

- [ ] **4.1 State requirements database**
  - Create JSON database of state requirements
  - Include: required subjects, hours, reporting, assessment
  - Start with top 10 homeschool states
  - Location: `src/data/stateRequirements.json`

- [ ] **4.2 State selector in settings**
  - Select state in onboarding/settings
  - Show summary of requirements
  - Validate activities against requirements
  - Location: `src/renderer/src/pages/Settings.tsx`

- [ ] **4.3 Attendance tracking**
  - Daily attendance log
  - Mark school days vs non-school days
  - Calculate attendance percentage
  - Required by many states
  - Location: `src/renderer/src/features/attendance/`

- [ ] **4.4 Portfolio PDF export**
  - Generate printable portfolio
  - Include: attendance, activities, photos, summaries
  - Customizable sections
  - Professional formatting
  - Location: `src/features/portfolio/`

- [ ] **4.5 Curriculum mapping**
  - Map activities to learning standards
  - Common Core alignment option
  - Custom curriculum support
  - Standards coverage report
  - Location: `src/renderer/src/features/curriculum/`

- [ ] **4.6 Official hour tracking**
  - Track instructional hours precisely
  - Separate by subject as required
  - Generate official hour reports
  - Alert when approaching minimums
  - Location: `src/renderer/src/features/hourTracking/`

---

### Phase 5: Community & Content

**Goal:** Make the app a hub for homeschool resources.

- [ ] **5.1 Activity templates library**
  - Pre-built activity templates
  - Organized by subject and grade
  - One-click to add template
  - Location: `src/renderer/src/features/templates/`

- [ ] **5.2 Curriculum recommendations**
  - Suggest curricula based on grade/subject
  - Link to popular homeschool curricula
  - User ratings and reviews (future)
  - Location: `src/renderer/src/features/recommendations/`

- [ ] **5.3 Resource library integration**
  - Quick links to Khan Academy, etc.
  - Log activity when using linked resource
  - Track time spent on external resources
  - Location: `src/renderer/src/features/resources/`

- [ ] **5.4 Field trip planner**
  - Plan field trips with details
  - Map integration for locations
  - Link activities to field trips
  - Share field trips with co-op
  - Location: `src/renderer/src/features/fieldTrips/`

- [ ] **5.5 Co-op group features**
  - Create/join co-op groups
  - Shared calendar for group events
  - Group field trip coordination
  - Location: `src/renderer/src/features/coop/`

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
- Example: "Phase 1.2: Add conflict resolution with vector clocks"

### Testing
- Run `npm run typecheck` before committing
- Run `npm test` if tests exist
- Manual test on desktop before marking complete

### Mobile Parity
- For UI features, consider mobile implementation
- Note mobile-specific tasks in Phase 2.6 and elsewhere
- Mobile can lag desktop but should eventually match

---

## Current Status

**Last Updated:** 2026-01-11

**Current Phase:** 2
**Current Task:** 2.5
**Blockers:** None

---

When every task above shows `[x]`, output:
```
<promise>ROADMAP COMPLETE</promise>
```
