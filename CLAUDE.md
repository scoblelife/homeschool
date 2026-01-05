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
- **Activity Types**: worksheet, video, reading, writing_print, writing_cursive, hands_on, game, assessment

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
