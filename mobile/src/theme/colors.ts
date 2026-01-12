/**
 * Color Theme Definitions
 *
 * Light and dark mode color palettes with semantic naming.
 */

export interface ColorTheme {
  // Base colors
  background: string
  surface: string
  surfaceSecondary: string
  card: string
  border: string

  // Text colors
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string

  // Primary brand colors
  primary: string
  primaryLight: string
  primaryDark: string

  // Status colors
  success: string
  successLight: string
  warning: string
  warningLight: string
  error: string
  errorLight: string

  // Student colors (keep consistent across themes)
  studentFuchsia: string
  studentTeal: string
  studentBlue: string
  studentOrange: string
  studentGreen: string
  studentPurple: string

  // UI elements
  separator: string
  overlay: string
  skeleton: string
}

export const lightColors: ColorTheme = {
  // Base colors
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceSecondary: '#f3f4f6',
  card: '#ffffff',
  border: '#e5e7eb',

  // Text colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',

  // Primary brand colors
  primary: '#d946ef',
  primaryLight: '#fdf4ff',
  primaryDark: '#a21caf',

  // Status colors
  success: '#22c55e',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  error: '#ef4444',
  errorLight: '#fef2f2',

  // Student colors
  studentFuchsia: '#d946ef',
  studentTeal: '#14b8a6',
  studentBlue: '#3b82f6',
  studentOrange: '#f97316',
  studentGreen: '#22c55e',
  studentPurple: '#8b5cf6',

  // UI elements
  separator: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.3)',
  skeleton: '#e5e7eb',
}

export const darkColors: ColorTheme = {
  // Base colors
  background: '#111827',
  surface: '#1f2937',
  surfaceSecondary: '#374151',
  card: '#1f2937',
  border: '#374151',

  // Text colors
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  textInverse: '#111827',

  // Primary brand colors
  primary: '#e879f9',
  primaryLight: '#3b1c4a',
  primaryDark: '#f0abfc',

  // Status colors
  success: '#4ade80',
  successLight: '#14532d',
  warning: '#fbbf24',
  warningLight: '#422006',
  error: '#f87171',
  errorLight: '#450a0a',

  // Student colors (brighter for dark mode)
  studentFuchsia: '#e879f9',
  studentTeal: '#2dd4bf',
  studentBlue: '#60a5fa',
  studentOrange: '#fb923c',
  studentGreen: '#4ade80',
  studentPurple: '#a78bfa',

  // UI elements
  separator: '#374151',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#374151',
}
