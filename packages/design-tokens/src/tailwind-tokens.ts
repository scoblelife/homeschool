/**
 * Tailwind-formatted design tokens
 * This file transforms the flat token exports into nested objects for Tailwind config
 */

import * as tokens from "../generated/index";

export const colors = {
  brand: {
    primary: tokens.ColorsBrandPrimary,
    primaryLight: tokens.ColorsBrandPrimaryLight,
    primaryDark: tokens.ColorsBrandPrimaryDark,
  },
  student: {
    fuchsia: {
      50: tokens.ColorsStudentFuchsia50,
      100: tokens.ColorsStudentFuchsia100,
      200: tokens.ColorsStudentFuchsia200,
      300: tokens.ColorsStudentFuchsia300,
      400: tokens.ColorsStudentFuchsia400,
      500: tokens.ColorsStudentFuchsia500,
      600: tokens.ColorsStudentFuchsia600,
      700: tokens.ColorsStudentFuchsia700,
      800: tokens.ColorsStudentFuchsia800,
      900: tokens.ColorsStudentFuchsia900,
    },
    teal: {
      50: tokens.ColorsStudentTeal50,
      100: tokens.ColorsStudentTeal100,
      200: tokens.ColorsStudentTeal200,
      300: tokens.ColorsStudentTeal300,
      400: tokens.ColorsStudentTeal400,
      500: tokens.ColorsStudentTeal500,
      600: tokens.ColorsStudentTeal600,
      700: tokens.ColorsStudentTeal700,
      800: tokens.ColorsStudentTeal800,
      900: tokens.ColorsStudentTeal900,
    },
    blue: {
      50: tokens.ColorsStudentBlue50,
      100: tokens.ColorsStudentBlue100,
      200: tokens.ColorsStudentBlue200,
      300: tokens.ColorsStudentBlue300,
      400: tokens.ColorsStudentBlue400,
      500: tokens.ColorsStudentBlue500,
      600: tokens.ColorsStudentBlue600,
      700: tokens.ColorsStudentBlue700,
      800: tokens.ColorsStudentBlue800,
      900: tokens.ColorsStudentBlue900,
    },
    orange: {
      50: tokens.ColorsStudentOrange50,
      100: tokens.ColorsStudentOrange100,
      200: tokens.ColorsStudentOrange200,
      300: tokens.ColorsStudentOrange300,
      400: tokens.ColorsStudentOrange400,
      500: tokens.ColorsStudentOrange500,
      600: tokens.ColorsStudentOrange600,
      700: tokens.ColorsStudentOrange700,
      800: tokens.ColorsStudentOrange800,
      900: tokens.ColorsStudentOrange900,
    },
    purple: {
      50: tokens.ColorsStudentPurple50,
      100: tokens.ColorsStudentPurple100,
      200: tokens.ColorsStudentPurple200,
      300: tokens.ColorsStudentPurple300,
      400: tokens.ColorsStudentPurple400,
      500: tokens.ColorsStudentPurple500,
      600: tokens.ColorsStudentPurple600,
      700: tokens.ColorsStudentPurple700,
      800: tokens.ColorsStudentPurple800,
      900: tokens.ColorsStudentPurple900,
    },
    green: {
      50: tokens.ColorsStudentGreen50,
      100: tokens.ColorsStudentGreen100,
      200: tokens.ColorsStudentGreen200,
      300: tokens.ColorsStudentGreen300,
      400: tokens.ColorsStudentGreen400,
      500: tokens.ColorsStudentGreen500,
      600: tokens.ColorsStudentGreen600,
      700: tokens.ColorsStudentGreen700,
      800: tokens.ColorsStudentGreen800,
      900: tokens.ColorsStudentGreen900,
    },
  },
  neutral: {
    text: tokens.ColorsNeutralText,
    textSecondary: tokens.ColorsNeutralTextSecondary,
    textTertiary: tokens.ColorsNeutralTextTertiary,
    textInverse: tokens.ColorsNeutralTextInverse,
    border: tokens.ColorsNeutralBorder,
    borderLight: tokens.ColorsNeutralBorderLight,
    surface: tokens.ColorsNeutralSurface,
    background: tokens.ColorsNeutralBackground,
    backgroundDeep: tokens.ColorsNeutralBackgroundDeep,
    separator: tokens.ColorsNeutralSeparator,
    overlay: tokens.ColorsNeutralOverlay,
    skeleton: tokens.ColorsNeutralSkeleton,
  },
  status: {
    success: tokens.ColorsStatusSuccess,
    successLight: tokens.ColorsStatusSuccessLight,
    successDark: tokens.ColorsStatusSuccessDark,
    warning: tokens.ColorsStatusWarning,
    warningLight: tokens.ColorsStatusWarningLight,
    warningDark: tokens.ColorsStatusWarningDark,
    error: tokens.ColorsStatusError,
    errorLight: tokens.ColorsStatusErrorLight,
    errorDark: tokens.ColorsStatusErrorDark,
    info: tokens.ColorsStatusInfo,
    infoLight: tokens.ColorsStatusInfoLight,
    infoDark: tokens.ColorsStatusInfoDark,
  },
  gray: {
    50: tokens.ColorsGray50,
    100: tokens.ColorsGray100,
    200: tokens.ColorsGray200,
    300: tokens.ColorsGray300,
    400: tokens.ColorsGray400,
    500: tokens.ColorsGray500,
    600: tokens.ColorsGray600,
    700: tokens.ColorsGray700,
    800: tokens.ColorsGray800,
    900: tokens.ColorsGray900,
  },
};

// Backwards compatibility: expose student colors at top level
// This allows existing code using bg-fuchsia-500, bg-teal-500, etc. to continue working
export const legacyColors = {
  child1: colors.student.fuchsia,
  child2: colors.student.teal,
  fuchsia: colors.student.fuchsia,
  teal: colors.student.teal,
  blue: colors.student.blue,
  orange: colors.student.orange,
  purple: colors.student.purple,
  green: colors.student.green,
};

export const spacing = {
  0: tokens.Spacing0,
  1: tokens.Spacing1,
  2: tokens.Spacing2,
  3: tokens.Spacing3,
  4: tokens.Spacing4,
  5: tokens.Spacing5,
  6: tokens.Spacing6,
  7: tokens.Spacing7,
  8: tokens.Spacing8,
  10: tokens.Spacing10,
  12: tokens.Spacing12,
  16: tokens.Spacing16,
  20: tokens.Spacing20,
  24: tokens.Spacing24,
};

export const fontSize = {
  xs: tokens.FontSizeXs,
  sm: tokens.FontSizeSm,
  base: tokens.FontSizeBase,
  lg: tokens.FontSizeLg,
  xl: tokens.FontSizeXl,
  "2xl": tokens.FontSize2xl,
  "3xl": tokens.FontSize3xl,
  "4xl": tokens.FontSize4xl,
  "5xl": tokens.FontSize5xl,
};

export const fontWeight = {
  normal: tokens.FontWeightNormal,
  medium: tokens.FontWeightMedium,
  semibold: tokens.FontWeightSemibold,
  bold: tokens.FontWeightBold,
};

export const lineHeight = {
  none: tokens.LineHeightNone,
  tight: tokens.LineHeightTight,
  snug: tokens.LineHeightSnug,
  normal: tokens.LineHeightNormal,
  relaxed: tokens.LineHeightRelaxed,
  loose: tokens.LineHeightLoose,
};

export const borderRadius = {
  none: tokens.BorderRadiusNone,
  sm: tokens.BorderRadiusSm,
  md: tokens.BorderRadiusMd,
  lg: tokens.BorderRadiusLg,
  xl: tokens.BorderRadiusXl,
  "2xl": tokens.BorderRadius2xl,
  full: tokens.BorderRadiusFull,
};

export const borderWidth = {
  0: tokens.BorderWidth0,
  1: tokens.BorderWidth1,
  2: tokens.BorderWidth2,
  4: tokens.BorderWidth4,
  8: tokens.BorderWidth8,
};

export const boxShadow = {
  sm: tokens.ShadowsSm,
  base: tokens.ShadowsBase,
  md: tokens.ShadowsMd,
  lg: tokens.ShadowsLg,
  xl: tokens.ShadowsXl,
  none: tokens.ShadowsNone,
};

// Export all tokens in Tailwind-compatible format
export const tailwindTokens = {
  colors: { ...colors, ...legacyColors },
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  borderWidth,
  boxShadow,
};
