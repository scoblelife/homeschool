# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homeschool management desktop application for tracking two children's education (Pre-K and 1st Grade). See `PRD.md` for full requirements.

## Technical Stack

- **Platform**: Electron (via electron-vite)
- **Frontend**: React 18 + TypeScript
- **Database**: DuckDB with local file storage
- **UI**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **Dev Environment**: Flox (Nix-based)

## Design System

The app uses a comprehensive design system with:

- **Design Tokens**: Semantic colors, spacing, typography generated from `design-tokens.json`
- **Component Library**: 13 UI components + 5 layout components in `src/renderer/src/components/`
- **ESLint Enforcement**: Custom rules prevent design system violations (set to 'error' severity)
- **Cross-Platform**: Shared tokens for desktop (Tailwind) and mobile (React Native)
- **Documentation**: See `DESIGN_SYSTEM.md` for full guide

### Quick Reference

```tsx
// ✅ Always use design system components
import { Button, Card, Input } from "@/components/ui";
import { PageContainer, PageHeader } from "@/components/layout";

// ✅ Use semantic design tokens
className = "bg-brand-primary text-status-success border-neutral-border";

// ❌ Never hardcode colors or use legacy classes
className = "bg-red-500"; // ❌ Use bg-status-error instead
className = "input label"; // ❌ Legacy classes removed
```

## Commands

```bash
# Activate dev environment
flox activate

# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## Architecture

```
src/
├── main/           # Electron main process
│   ├── index.ts    # App entry, window creation
│   └── ipc.ts      # IPC handlers for database operations
├── preload/        # Electron preload (context bridge)
│   └── index.ts    # Exposes window.api to renderer
├── renderer/       # React frontend
│   └── src/
│       ├── pages/      # Route components
│       ├── layouts/    # MainLayout with sidebar
│       ├── components/ # Reusable UI components
│       ├── stores/     # Zustand state management
│       └── hooks/      # Custom hooks (useDatabase, etc.)
├── database/       # DuckDB operations
│   ├── connection.ts   # DB connection singleton
│   ├── schema.ts       # Table definitions + seed data
│   └── repositories/   # CRUD operations per entity
└── shared/
    └── types.ts    # TypeScript types shared between processes
```

## Key Concepts

- **Session**: A teaching/learning event with start/end time
- **Activity**: Individual completed item (worksheet, video, reading, writing practice, etc.)
- **Activity Types** (6 types - reduced from 9 for better UX):
  - Core types: `worksheet`, `video`, `reading`, `writing`, `hands_on`, `interactive`
  - **writing** consolidates print/cursive (stored in optional `activitySubType` field)
  - **interactive** consolidates games/assessments/events (stored in optional `activitySubType` field)
- **Universal Status**: Unified status system across all entities
  - Values: `not_started`, `in_progress`, `completed`, `cancelled`
  - Used by: Milestones, Field Trips, Assessments, Reading progress
- **Event Categories** (field trips): `educational`, `social`, `coop`

## Data Storage

DuckDB database stored in `~/.homeschool/homeschool.db`. Parquet exports go to `~/.homeschool/parquet/`.

## IPC Communication

Renderer communicates with main process via `window.api`:

- `window.api.getStudents()`, `createStudent()`, etc.
- `window.api.getSessions()`, `createSession()`, etc.
- `window.api.getActivities()`, `createActivity()`, etc.
- `window.api.getActivitySummary()`, `getDailySummaries()` for reports

## Building for Distribution

### Mac (from macOS)

```bash
npm run build:mac
```

Creates DMG installers in `dist/`:

- `Homeschool-{version}-x64.dmg` - Intel Macs
- `Homeschool-{version}-arm64.dmg` - Apple Silicon Macs

**Note**: First build takes 15-30 minutes (DuckDB compiles from source). Subsequent builds are faster.

**Code signing**: For distribution outside your machine, you need an Apple Developer certificate. Without signing, users must right-click → Open to bypass Gatekeeper.

### Windows (from Windows)

```bash
npm run build:win
```

Creates NSIS installer in `dist/`:

- `Homeschool-{version}-Setup.exe`

**Requirements**:

- Windows 10/11 with Node.js 18+
- Run `npm install` first to get Windows-native DuckDB bindings

### Linux (from Linux)

```bash
npm run build:linux
```

Creates AppImage and .deb in `dist/`.

### Cross-Platform Builds

You cannot build Windows from Mac or vice versa due to native DuckDB bindings. Options:

1. Build on each target platform
2. Use GitHub Actions CI for automated builds (see below)
3. Use a Windows VM for Windows builds

### GitHub Actions (Automated)

The `.github/workflows/build.yml` workflow automatically builds for all platforms:

**Triggers:**

- Push to `main` branch
- Pull requests to `main`
- Git tags starting with `v` (e.g., `v1.0.0`)
- Manual trigger via GitHub UI

**To create a release:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

This builds Mac, Windows, and Linux versions and creates a draft GitHub Release with all installers attached.

**Artifacts** (available on every build):

- `Homeschool-mac` - DMG files for Intel and Apple Silicon
- `Homeschool-windows` - Setup.exe installer
- `Homeschool-linux` - AppImage and .deb

## Development Notes

- Two children with different grade levels - UI uses colors (fuchsia for child1, teal for child2)
- Preload script must be CJS format (outputs as `.cjs`) due to "type": "module" in package.json
- Nevada has minimal homeschool reporting requirements but app generates portfolio-ready documentation

## Design System

The application uses a **token-based design system** with a single source of truth (`design-tokens.json`) that generates platform-specific code for both desktop and mobile.

### Key Principles

1. **Use design system components** - Don't create custom styled components
2. **Use design tokens** - Don't hardcode colors, spacing, or typography values
3. **Follow naming conventions** - Use semantic names (brand-primary, not fuchsia-500)
4. **Cross-platform consistency** - Desktop and mobile share identical design values

### Component Usage (Desktop)

Always use components from the UI library:

```tsx
import { Button, Card, Badge, Input, Modal, Alert } from '@/components/ui'
import { PageHeader, PageContainer, PageGrid } from '@/components/layout'

// ✅ Good - uses design system
<Button variant="primary">Save</Button>
<Card><p>Content</p></Card>

// ❌ Bad - custom styling
<button className="bg-fuchsia-500 px-4 py-2 rounded-lg">Save</button>
```

### Color Tokens (Desktop/Tailwind)

```tsx
// ✅ Use design system tokens
<div className="bg-brand-primary text-neutral-text">
<button className="bg-status-success hover:bg-status-successDark">
<span className="text-student-fuchsia-500">

// ❌ Don't use hardcoded colors
<div className="bg-fuchsia-500 text-gray-900">
<div className="bg-[#d946ef]">
```

### Theme System (Mobile)

```tsx
import { useColors } from "@/theme/ThemeContext";

function MyComponent() {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.primary }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### Design Token Generation

Design tokens are automatically generated from `design-tokens.json`:

```bash
# Tokens are generated during build
npm run build

# Desktop: design-tokens.json → src/renderer/src/design/tokens/
# Mobile: design-tokens.json → mobile/src/theme/tokens.ts
```

### ESLint Rules

The codebase enforces design system usage with custom ESLint rules:

- `design-system/no-hardcoded-colors` - Prevents hardcoded color classes
- `design-system/require-design-system-components` - Warns against custom styled elements
- `design-system/no-legacy-classes` - Flags deprecated CSS classes
- `design-system/pages-use-components-only` - Prevents complex inline styling in pages

### Deprecated Patterns

**Legacy CSS classes are deprecated:**

- `.btn-*`, `.card`, `.badge-*`, `.input`, `.label` - Use UI components instead

See `src/renderer/src/components/ui/DesignSystem.mdx` for full documentation.

## Mobile App (iOS & Android)

The `mobile/` directory contains a React Native Expo app for iOS and Android.

### Mobile Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **Database**: expo-sqlite (SQLite)
- **State Management**: Zustand
- **UI**: Custom mobile-first component library

### Mobile Commands

```bash
# Install mobile dependencies
npm run mobile:install

# Start Expo development server
npm run mobile

# Run on iOS simulator
npm run mobile:ios

# Run on Android emulator
npm run mobile:android

# Build for iOS (requires EAS CLI)
npm run mobile:build:ios

# Build for Android
npm run mobile:build:android
```

### Mobile Architecture

```
mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with initialization
│   └── (tabs)/            # Tab navigation screens
│       ├── index.tsx      # Dashboard
│       ├── activities.tsx # Activity logging
│       ├── milestones.tsx # Milestone tracking
│       ├── field-trips.tsx# Event planning
│       └── settings.tsx   # Student management
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/           # Design system (Button, Card, etc.)
│   ├── database/          # SQLite layer (mirrors desktop)
│   ├── stores/            # Zustand state
│   └── types/             # TypeScript types
├── app.json              # Expo configuration
└── eas.json              # EAS Build configuration
```

### Mobile Features

- Dashboard with today's activities, stars, and upcoming events
- Quick activity logging with subject selection
- Milestone tracking with star rewards
- Field trip and event planning
- Student management with customizable colors
- Offline-first with local SQLite database
