# Design System Guide

Comprehensive guide for using and contributing to the Homeschool app design system.

## Overview

The Homeschool app uses a **token-based design system** with:

- Single source of truth (`design-tokens.json`)
- Automatic code generation for desktop (Tailwind) and mobile (React Native)
- Reusable component library
- ESLint enforcement
- Cross-platform consistency

## Quick Start

### For Desktop Development

```tsx
// ✅ Use design system components
import { Button, Card, Input, Badge, Modal } from "@/components/ui";
import { PageHeader, PageGrid } from "@/components/layout";

function MyPage() {
  return (
    <>
      <PageHeader title="My Page" subtitle="Description" />
      <Card>
        <Input label="Name" />
        <Button variant="primary">Save</Button>
      </Card>
    </>
  );
}
```

### For Mobile Development

```tsx
// ✅ Use theme colors
import { useColors } from "@/theme/ThemeContext";
import { Button, Card } from "@/components/ui";

function MyComponent() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Card>
        <Button variant="primary">Save</Button>
      </Card>
    </View>
  );
}
```

## Design Tokens

### What are Design Tokens?

Design tokens are **named entities** that store visual design attributes. They ensure consistency across platforms.

**Location:** `design-tokens.json` (project root)

### Token Categories

1. **Colors** - Brand, student, status, neutral colors
2. **Spacing** - Consistent spacing scale (4px base)
3. **Typography** - Font sizes, weights, line heights
4. **Border Radius** - sm, md, lg, xl, full
5. **Shadows** - Elevation levels
6. **Animation** - Duration and easing values
7. **Z-Index** - Layering system

### How Tokens are Generated

```bash
# Automatic during build
npm run build

# Manual generation
npm run tokens:build
```

**Output:**

- Desktop: `src/renderer/src/design/tokens/index.ts`
- Mobile: `mobile/src/theme/tokens.ts`

## Component Library

### Desktop Components

#### Core UI Components

Located in `src/renderer/src/components/ui/`

| Component  | Variants                                         | Usage              |
| ---------- | ------------------------------------------------ | ------------------ |
| **Button** | primary, secondary, outline, ghost, danger       | Actions            |
| **Card**   | default                                          | Content containers |
| **Badge**  | default, primary, success, warning, danger, info | Status labels      |
| **Input**  | default, error                                   | Text input         |
| **Modal**  | default                                          | Dialogs, overlays  |
| **Alert**  | success, warning, danger, info                   | Notifications      |

**Example:**

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>;
```

#### Layout Components

Located in `src/renderer/src/components/layout/`

| Component         | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| **PageContainer** | Max-width content wrapper                        |
| **PageHeader**    | Standard page header with title/subtitle/actions |
| **PageSection**   | Section wrapper with optional title              |
| **PageGrid**      | Responsive grid (1/2/3/4 columns)                |
| **StatCard**      | Dashboard metric display                         |

**Example:**

```tsx
import { PageHeader, PageGrid, StatCard } from "@/components/layout";

<PageContainer>
  <PageHeader
    title="Dashboard"
    subtitle="Overview of recent activity"
    action={<Button>Add Activity</Button>}
  />
  <PageGrid cols={3}>
    <StatCard value={42} label="Activities This Week" />
    <StatCard value={98} label="Total Stars" />
    <StatCard value={15} label="Milestones" />
  </PageGrid>
</PageContainer>;
```

### Mobile Components

Located in `mobile/src/components/ui/`

All mobile components use the theme system via `useColors()` hook.

**Example:**

```tsx
import { Button, Card, Input } from "@/components/ui";
import { useColors } from "@/theme/ThemeContext";

function MyScreen() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Card>
        <Input label="Name" />
        <Button variant="primary">Submit</Button>
      </Card>
    </View>
  );
}
```

## Color System

### Desktop (Tailwind)

Use semantic token names, not color values:

```tsx
// ✅ Good - semantic tokens
<div className="bg-brand-primary text-neutral-text">
<button className="bg-status-success hover:bg-status-successDark">
<span className="text-student-fuchsia-500">

// ❌ Bad - hardcoded colors
<div className="bg-fuchsia-500 text-gray-900">
<div className="bg-[#d946ef]">
<span className="text-blue-600">
```

### Mobile (React Native)

Use the theme hook:

```tsx
import { useColors } from "@/theme/ThemeContext";

function MyComponent() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### Available Color Tokens

#### Brand

- `brand-primary` - Primary brand color (#d946ef)
- `brand-primaryLight` - Light variant
- `brand-primaryDark` - Dark variant

#### Student Colors

- `student-fuchsia-{50-900}`
- `student-teal-{50-900}`
- `student-blue-{50-900}`
- `student-orange-{50-900}`
- `student-purple-{50-900}`
- `student-green-{50-900}`

#### Status

- `status-success` / `status-successLight` / `status-successDark`
- `status-warning` / `status-warningLight` / `status-warningDark`
- `status-error` / `status-errorLight` / `status-errorDark`
- `status-info` / `status-infoLight` / `status-infoDark`

#### Neutral

- `neutral-text` - Primary text (#1f2937)
- `neutral-textSecondary` - Secondary text
- `neutral-textTertiary` - Tertiary text/placeholders
- `neutral-textInverse` - Light text on dark backgrounds
- `neutral-border` - Borders and dividers
- `neutral-surface` - Card backgrounds
- `neutral-background` - Page background

## Migration Guide

### Migrating from Legacy CSS Classes

The following CSS classes are **deprecated**:

| Deprecated             | Replacement                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `.btn`, `.btn-primary` | `<Button variant="primary">`                                          |
| `.btn-secondary`       | `<Button variant="secondary">`                                        |
| `.btn-outline`         | `<Button variant="outline">`                                          |
| `.btn-danger`          | `<Button variant="danger">`                                           |
| `.card`                | `<Card>` component                                                    |
| `.badge`, `.badge-*`   | `<Badge variant="...">`                                               |
| `.input`               | `<Input />` component                                                 |
| `.label`               | Inline Tailwind or `<label>` with `text-sm font-medium text-gray-700` |

**Example Migration:**

```tsx
// ❌ Before (deprecated)
<button className="btn btn-primary">Save</button>
<div className="card">
  <label className="label">Name</label>
  <input className="input" />
</div>

// ✅ After (current)
<Button variant="primary">Save</Button>
<Card>
  <Input label="Name" />
</Card>
```

### Migrating from Hardcoded Colors

```tsx
// ❌ Before
<div className="bg-fuchsia-500 text-white">
<button className="bg-green-500 hover:bg-green-600">
<span className="text-blue-600">

// ✅ After
<div className="bg-brand-primary text-neutral-textInverse">
<button className="bg-status-success hover:bg-status-successDark">
<span className="text-student-blue-500">
```

## ESLint Rules

The codebase enforces design system usage:

### `design-system/no-hardcoded-colors`

Prevents hardcoded Tailwind color classes.

```tsx
// ❌ Error
<div className="bg-fuchsia-500">

// ✅ Pass
<div className="bg-brand-primary">
```

### `design-system/require-design-system-components`

Warns against custom styled HTML elements.

```tsx
// ⚠️ Warning
<button className="px-4 py-2 bg-blue-500 text-white rounded">

// ✅ Pass
<Button variant="primary">
```

### `design-system/no-legacy-classes`

Flags deprecated CSS classes.

```tsx
// ⚠️ Warning
<button className="btn btn-primary">

// ✅ Pass
<Button variant="primary">
```

### `design-system/pages-use-components-only`

Warns against complex inline styling in pages.

```tsx
// ⚠️ Warning - in page components
<div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm rounded-lg">

// ✅ Pass - extracted to component
<PageHeader title="..." />
```

## Adding New Design Tokens

1. **Edit** `design-tokens.json`:

```json
{
  "colors": {
    "myNewColor": {
      "value": "#hexcode",
      "$description": "Description of usage"
    }
  }
}
```

2. **Generate** tokens:

```bash
npm run tokens:build
```

3. **Use** in code:

```tsx
// Desktop
<div className="bg-myNewColor">

// Mobile
const colors = useColors()
<View style={{ backgroundColor: colors.myNewColor }}>
```

## Creating New Components

### Desktop Component Template

```tsx
// src/renderer/src/components/ui/MyComponent/MyComponent.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MyComponentProps {
  children: ReactNode;
  variant?: "default" | "special";
  className?: string;
}

export function MyComponent({
  children,
  variant = "default",
  className,
}: MyComponentProps) {
  return (
    <div
      className={cn(
        "base-styles",
        variant === "special" && "special-styles",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

### Mobile Component Template

```tsx
// mobile/src/components/ui/MyComponent.tsx
import { ReactNode } from "react";
import { View, Text, ViewStyle } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface MyComponentProps {
  children: ReactNode;
  variant?: "default" | "special";
  style?: ViewStyle;
}

export function MyComponent({
  children,
  variant = "default",
  style,
}: MyComponentProps) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor:
          variant === "special" ? colors.primary : colors.surface,
        padding: 16,
        borderRadius: 8,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
```

## Testing

### Visual Testing

```bash
# Run Storybook
npm run storybook

# Build Storybook
npm run build-storybook

# Run visual regression tests
npm run test-storybook
```

### TypeScript Validation

```bash
# Desktop
npm run typecheck

# Mobile
cd mobile && npx tsc --noEmit
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint --fix
```

## Accessibility Guidelines

1. **Color Contrast** - All text meets WCAG AA (4.5:1)
2. **Focus States** - All interactive elements have visible focus
3. **Touch Targets** - Minimum 44x44px on mobile
4. **Semantic HTML** - Use proper heading hierarchy
5. **ARIA Labels** - Add labels to icon-only buttons
6. **Keyboard Navigation** - All actions accessible via keyboard

## Best Practices

### DO

✅ Use design system components
✅ Use design tokens for colors, spacing, typography
✅ Follow semantic naming (brand-primary, not purple-500)
✅ Extract reusable patterns into components
✅ Test in Storybook before using in pages
✅ Document component variants in stories
✅ Ensure cross-platform parity when applicable

### DON'T

❌ Create custom styled buttons, inputs, cards
❌ Hardcode colors, spacing, or font sizes
❌ Use legacy CSS classes (.btn, .card, .input)
❌ Add complex inline styling in page components
❌ Mix design system and custom styling
❌ Skip accessibility attributes
❌ Ignore ESLint warnings

## Resources

- **Design System Docs**: `src/renderer/src/components/ui/DesignSystem.mdx`
- **Component Stories**: `src/renderer/src/components/ui/**/*.stories.tsx`
- **Design Tokens**: `design-tokens.json`
- **CLAUDE.md**: Development guidelines
- **PRD.md**: Product requirements

## Getting Help

1. Check component stories in Storybook
2. Review `DesignSystem.mdx` for visual examples
3. Look at existing page implementations
4. Ask in pull requests or issues

## Roadmap

### Completed

- ✅ Design token system with Style Dictionary
- ✅ Core UI components (Button, Card, Badge, Input, Modal, Alert)
- ✅ Layout components (PageHeader, PageGrid, etc.)
- ✅ Mobile theme system with light/dark mode
- ✅ ESLint enforcement rules
- ✅ Cross-platform color parity

### In Progress

- 🔄 Page migration to design system components
- 🔄 Elimination of legacy CSS classes
- 🔄 Storybook documentation expansion

### Planned

- 📋 Visual regression testing
- 📋 Accessibility audit (90%+ WCAG AA)
- 📋 Component library npm package
- 📋 Design token documentation site

---

**Last Updated**: January 2026
**Version**: 1.0.0
