/**
 * Responsive Container
 *
 * Centers content and applies max-width constraints on larger screens.
 * Automatically adjusts padding based on device type.
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useDeviceType } from "../hooks/useDeviceType";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Whether to apply padding (default: true) */
  padded?: boolean;
  /** Whether to center content horizontally (default: true on tablets) */
  centered?: boolean;
  /** Max width override */
  maxWidth?: number;
  /** Fill available height (default: true) */
  flex?: boolean;
}

export function ResponsiveContainer({
  children,
  style,
  padded = true,
  centered,
  maxWidth,
  flex = true,
}: ResponsiveContainerProps) {
  const { isTablet, contentMaxWidth, isLandscape } = useDeviceType();

  const effectiveMaxWidth = maxWidth ?? contentMaxWidth;
  const shouldCenter = centered ?? isTablet;

  // Padding scales up on tablets
  const horizontalPadding = isTablet ? (isLandscape ? 32 : 24) : 16;
  const verticalPadding = isTablet ? 24 : 16;

  return (
    <View style={[flex && styles.flex, shouldCenter && styles.centered, style]}>
      <View
        style={[
          flex && styles.flex,
          shouldCenter && { maxWidth: effectiveMaxWidth, width: "100%" },
          padded && {
            paddingHorizontal: horizontalPadding,
            paddingVertical: verticalPadding,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
  },
});
