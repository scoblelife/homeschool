/**
 * Master-Detail Layout
 *
 * Displays a list (master) and detail view side-by-side on tablets,
 * or as separate screens on phones.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDeviceType } from "../hooks/useDeviceType";

interface MasterDetailLayoutProps<T> {
  /** The list view component */
  masterContent: React.ReactNode;
  /** The detail view component (receives selected item) */
  detailContent: React.ReactNode;
  /** Width of the master panel (default: 320 on tablet, full width on phone) */
  masterWidth?: number;
  /** Whether an item is currently selected */
  hasSelection?: boolean;
  /** Placeholder when no item is selected (tablet only) */
  emptyDetail?: React.ReactNode;
  /** Style for the container */
  style?: ViewStyle;
  /** Callback when back button is pressed (phone only) */
  onBack?: () => void;
  /** Title for the detail view (phone only, for header) */
  detailTitle?: string;
}

export function MasterDetailLayout<T>({
  masterContent,
  detailContent,
  masterWidth = 350,
  hasSelection = false,
  emptyDetail,
  style,
  onBack,
  detailTitle,
}: MasterDetailLayoutProps<T>) {
  const { shouldUseMasterDetail, isTablet, width } = useDeviceType();

  // On tablets with master-detail, show both panels side by side
  if (shouldUseMasterDetail) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.masterPanel, { width: masterWidth }]}>
          {masterContent}
        </View>
        <View style={styles.divider} />
        <View style={styles.detailPanel}>
          {hasSelection
            ? detailContent
            : (emptyDetail ?? (
                <View style={styles.emptyDetail}>
                  <Ionicons
                    name="document-text-outline"
                    size={64}
                    color="#d1d5db"
                  />
                  <Text style={styles.emptyDetailText}>
                    Select an item to view details
                  </Text>
                </View>
              ))}
        </View>
      </View>
    );
  }

  // On phones or portrait tablets, show one panel at a time
  // When there's a selection, show detail with back button
  if (hasSelection && onBack) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.phoneDetail}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to list"
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {detailContent}
        </View>
      </View>
    );
  }

  // Show master (list) by default
  return <View style={[styles.container, style]}>{masterContent}</View>;
}

/**
 * Hook to manage master-detail selection state
 */
export function useMasterDetail<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const { shouldUseMasterDetail } = useDeviceType();

  const select = useCallback((item: T) => {
    setSelectedItem(item);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return {
    selectedItem,
    hasSelection: selectedItem !== null,
    select,
    clearSelection,
    isMasterDetailMode: shouldUseMasterDetail,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  masterPanel: {
    backgroundColor: "#f9fafb",
    borderRightWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  detailPanel: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  emptyDetail: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyDetailText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
  phoneDetail: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 4,
  },
});
