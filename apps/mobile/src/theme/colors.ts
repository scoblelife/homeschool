/**
 * Color Theme Definitions
 *
 * Light and dark mode color palettes with semantic naming.
 * Light mode colors are sourced from generated design tokens.
 */

import * as tokens from "./tokens";

export interface ColorTheme {
  // Base colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  border: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;

  // Student colors (keep consistent across themes)
  studentFuchsia: string;
  studentTeal: string;
  studentBlue: string;
  studentOrange: string;
  studentGreen: string;
  studentPurple: string;

  // UI elements
  separator: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ColorTheme = {
  // Base colors - using generated design tokens
  background: tokens.ColorsNeutralSurface,
  surface: tokens.ColorsNeutralBackground,
  surfaceSecondary: tokens.ColorsNeutralBackgroundDeep,
  card: tokens.ColorsNeutralSurface,
  border: tokens.ColorsNeutralBorder,

  // Text colors - using generated design tokens
  text: tokens.ColorsNeutralText,
  textSecondary: tokens.ColorsNeutralTextSecondary,
  textTertiary: tokens.ColorsNeutralTextTertiary,
  textInverse: tokens.ColorsNeutralTextInverse,

  // Primary brand colors - using generated design tokens
  primary: tokens.ColorsBrandPrimary,
  primaryLight: tokens.ColorsBrandPrimaryLight,
  primaryDark: tokens.ColorsBrandPrimaryDark,

  // Status colors - using generated design tokens
  success: tokens.ColorsStatusSuccess,
  successLight: tokens.ColorsStatusSuccessLight,
  warning: tokens.ColorsStatusWarning,
  warningLight: tokens.ColorsStatusWarningLight,
  warningDark: tokens.ColorsStatusWarningDark,
  error: tokens.ColorsStatusError,
  errorLight: tokens.ColorsStatusErrorLight,

  // Student colors - using generated design tokens
  studentFuchsia: tokens.ColorsStudentFuchsia500,
  studentTeal: tokens.ColorsStudentTeal500,
  studentBlue: tokens.ColorsStudentBlue500,
  studentOrange: tokens.ColorsStudentOrange500,
  studentGreen: tokens.ColorsStudentGreen500,
  studentPurple: tokens.ColorsStudentPurple500,

  // UI elements - using generated design tokens
  separator: tokens.ColorsNeutralSeparator,
  overlay: tokens.ColorsNeutralOverlay,
  skeleton: tokens.ColorsNeutralSkeleton,
};

export const darkColors: ColorTheme = {
  // Base colors
  background: "#111827",
  surface: "#1f2937",
  surfaceSecondary: "#374151",
  card: "#1f2937",
  border: "#374151",

  // Text colors
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  textTertiary: "#6b7280",
  textInverse: "#111827",

  // Primary brand colors
  primary: "#e879f9",
  primaryLight: "#3b1c4a",
  primaryDark: "#f0abfc",

  // Status colors
  success: "#4ade80",
  successLight: "#14532d",
  warning: "#fbbf24",
  warningLight: "#422006",
  warningDark: "#92400e",
  error: "#f87171",
  errorLight: "#450a0a",

  // Student colors (brighter for dark mode)
  studentFuchsia: "#e879f9",
  studentTeal: "#2dd4bf",
  studentBlue: "#60a5fa",
  studentOrange: "#fb923c",
  studentGreen: "#4ade80",
  studentPurple: "#a78bfa",

  // UI elements
  separator: "#374151",
  overlay: "rgba(0, 0, 0, 0.5)",
  skeleton: "#374151",
};
