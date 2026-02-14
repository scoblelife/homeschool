# CLAUDE.md

## Project Overview

Homeschool management app — Electron desktop, React Native mobile, TanStack Start web, admin panel, WebSocket relay. See `PRD.md` for requirements, `DESIGN_SYSTEM.md` for design guide.

## Monorepo Structure

pnpm (v10) workspaces. `shamefully-hoist=true` for Electron/Expo compatibility.

```
apps/desktop/        # Electron + React 18 + DuckDB + Zustand
apps/mobile/         # React Native Expo + expo-sqlite
apps/web/            # TanStack Start + Drizzle ORM + PostgreSQL
apps/admin-panel/    # Convex admin dashboard
apps/relay/          # WebSocket relay server
packages/shared-types/  # Domain types (raw TS, no build step)
packages/ui/            # React + Tailwind + Headless UI components (zero Electron coupling)
packages/design-tokens/ # style-dictionary → Tailwind / CSS vars / React Native
signaling/           # Rust Axum signaling server (outside pnpm workspace)
```

## Commands

```bash
flox activate                              # Dev environment
pnpm install                               # Install deps
pnpm tokens:build                          # Build design tokens (required first run)
pnpm dev                                   # Desktop dev
pnpm build:mac | build:win | build:linux   # Desktop installers → apps/desktop/dist/
pnpm mobile                                # Expo dev server
pnpm mobile:ios | mobile:android           # Mobile simulators
pnpm --filter @homeschool/web dev          # Web dev server
pnpm typecheck                             # Type check all packages
pnpm test                                  # Desktop tests
pnpm lint                                  # Desktop lint
pnpm storybook                             # Storybook
```

## Key Domain Concepts

- **Session**: Teaching/learning event with start/end time
- **Activity**: Completed item — 6 types: `worksheet`, `video`, `reading`, `writing`, `hands_on`, `interactive`
  - `writing` consolidates print/cursive via optional `activitySubType`
  - `interactive` consolidates games/assessments/events via optional `activitySubType`
- **Universal Status**: `not_started | in_progress | completed | cancelled`
- **Event Categories**: `educational | social | coop`
- **Desktop storage**: DuckDB at `~/.homeschool/homeschool.db`, Parquet exports at `~/.homeschool/parquet/`
- **Web storage**: PostgreSQL via Drizzle ORM (Railway)
- **IPC**: Renderer uses `window.api.*` (getStudents, createSession, getActivities, etc.)
- Two children: fuchsia (child1), teal (child2). Nevada homeschool requirements.
- Preload script outputs as `.cjs` due to `"type": "module"` in package.json.

---

## Coding Standards: NASA Power of Ten + TigerStyle

Mandatory rules. Priority: **Safety > Performance > Developer Experience**.

### 10 Rules

1. **Simple Control Flow** — No recursion. No `eval()`. No complex nested ternaries. Use early returns, `if/else`, `switch`, `for...of`.

2. **Fixed Loop Bounds** — Every loop must have a provable finite limit. No `while (true)`. Polling/retries need explicit max counts and timeouts. Array methods on finite collections are fine.

3. **No Allocation in Hot Paths** — Pre-allocate at init. No object/array/closure creation in render loops or high-frequency handlers. Use `useMemo`/`useCallback` in React.

4. **70-Line Function Limit** — Includes React component bodies. Extract sub-components or hooks when approaching limit.

5. **Validate Inputs and Outputs** — Every function accepting external data (IPC, API, user input, DB results) must validate. Average 2+ validations per non-trivial function. Assert both positive space (what must be true) and negative space (what must not be true).

6. **Smallest Possible Scope** — Declare variables at narrowest scope. Calculate/check values close to usage. Temporal gaps between declaration and use are where bugs hide.

7. **Handle All Errors** — Every `await` needs error handling. Every `.then()` needs `.catch()`. Never silently swallow. Log with context: `[ComponentName] what failed: error`. 92% of catastrophic distributed system failures come from mishandled non-fatal errors.

8. **Minimal Abstraction** — No wrappers that just forward args. No indirection "for future flexibility." Abstract only when pattern repeats 3+ times and maps cleanly to the domain.

9. **Max 3 Nesting Levels** — Use early returns, guard clauses, and extracted helpers to flatten. Push `if`s up and `for`s down.

10. **Strict Compiler, Zero Warnings** — TypeScript strict mode. ESLint rules at `error`. Zero `@ts-ignore`/`eslint-disable` without a justifying comment.

### Naming (TigerStyle for TypeScript)

- **camelCase** but append qualifiers/units last, sorted by significance: `connectionDelayMs`, `retryCountMax`, `sessionDurationMinutes` — not `maxRetries`, `delay`, `duration`.
- **Never abbreviate**: `student` not `stu`, `activity` not `act`. Exceptions: `id`, `url`, `db`.
- **Match character count** for related names: `source`/`target` not `src`/`destination`.
- **Booleans state positively**: `isVisible`, `hasAccess`, `canEdit`.
- **Nouns for data, verbs for actions**: `studentList`, `fetchStudents`, `isLoading`.

### Error Philosophy

- Test error paths, not just happy paths.
- Error messages include context: what was being done, what went wrong, what values were involved.
- Fail fast and loud in dev. Validate exhaustively at system boundaries (IPC, API, DB). Trust types inside pure business logic.

### Performance

- Design for performance upfront — 1000x wins happen in design, not profiling.
- Back-of-envelope: how many students/sessions/activities? What's the bottleneck?
- Batch: one query returning 100 rows beats 100 queries.
- Separate control plane (UI, routing, state) from data plane (DB, sync, file I/O).

---

## Design System

Tokens from `packages/design-tokens/design-tokens.json`. Components from `packages/ui/`. Cross-platform: desktop/web (Tailwind) + mobile (React Native).

```tsx
import { Button, Card, Input } from "@homeschool/ui";
import { PageContainer, PageHeader } from "@homeschool/ui/layout";
className = "bg-brand-primary text-status-success border-neutral-border";
// NEVER: bg-red-500, bg-[#d946ef], .btn-*, .card, .input, .label
```

ESLint enforces: `no-hardcoded-colors`, `require-design-system-components`, `no-legacy-classes`, `pages-use-components-only`.

## CI/CD

- `build.yml` — Desktop builds on `v*` tags (Mac/Win/Linux)
- `mobile-build.yml` — Mobile builds on `apps/mobile/**` changes
- `typecheck.yml` — Full typecheck on all PRs

## Deployment

All on Railway with GitHub service auto-deploy: signaling (`signaling/railway.toml`), web (`apps/web/railway.toml`), relay (`apps/relay/railway.toml`).
