/**
 * Responsive Grid
 *
 * Displays children in a responsive grid layout that adapts to screen size.
 * Uses flexbox with wrapping to create a grid-like layout.
 */

import React from "react";
import { View, StyleSheet, ViewStyle, DimensionValue } from "react-native";
import { useDeviceType } from "../hooks/useDeviceType";

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Minimum width for each item (used to calculate columns) */
  minItemWidth?: number;
  /** Fixed number of columns (overrides minItemWidth calculation) */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: number;
  /** Gap between rows (defaults to gap) */
  rowGap?: number;
}

export function ResponsiveGrid({
  children,
  style,
  minItemWidth = 280,
  columns: fixedColumns,
  gap = 16,
  rowGap,
}: ResponsiveGridProps) {
  const { width, columns: autoColumns } = useDeviceType();

  // Calculate columns based on min item width, or use fixed/auto columns
  const calculatedColumns =
    fixedColumns ?? Math.max(1, Math.floor(width / minItemWidth));
  const effectiveColumns = Math.min(calculatedColumns, autoColumns);

  // Calculate item width accounting for gaps
  const itemWidth = `${100 / effectiveColumns}%` as DimensionValue;

  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,
            {
              width: itemWidth,
              paddingRight: (index + 1) % effectiveColumns === 0 ? 0 : gap,
              paddingBottom: rowGap ?? gap,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    // Width is set dynamically
  },
  twoColumn: {
    flexDirection: "row",
  },
});

/**
 * Simple two-column layout for tablets
 */
export function TwoColumnLayout({
  left,
  right,
  leftWidth = "50%",
  gap = 24,
  style,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: DimensionValue;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.twoColumn, { gap }, style]}>
      <View style={{ width: leftWidth }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
}
