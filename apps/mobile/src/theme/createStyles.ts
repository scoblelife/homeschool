/**
 * Theme-aware StyleSheet helper
 *
 * This utility makes it easy for components to create theme-aware styles
 * without hardcoding color values.
 *
 * Usage:
 * ```tsx
 * import { createThemedStyles } from '@/theme/createStyles'
 *
 * const useStyles = createThemedStyles((colors) => ({
 *   button: {
 *     backgroundColor: colors.primary,
 *     borderRadius: 8,
 *   },
 *   text: {
 *     color: colors.text,
 *   }
 * }))
 *
 * function MyComponent() {
 *   const styles = useStyles()
 *   return <View style={styles.button}>...</View>
 * }
 * ```
 */

import { StyleSheet } from "react-native";
import { useColors } from "./ThemeContext";
import type { ColorTheme } from "./colors";

/**
 * Creates a hook that generates theme-aware styles
 *
 * @param styleFactory - Function that takes colors and returns style object
 * @returns Hook that returns StyleSheet with theme-aware styles
 */
export function createThemedStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(styleFactory: (colors: ColorTheme) => T | StyleSheet.NamedStyles<T>) {
  return () => {
    const colors = useColors();
    return StyleSheet.create(styleFactory(colors));
  };
}

/**
 * Direct hook to access theme colors
 *
 * Convenience re-export for components that need colors but not full styles
 */
export { useColors } from "./ThemeContext";
