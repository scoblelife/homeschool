import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useColors } from "../theme/createStyles";
import type { ColorTheme } from "../theme/colors";
import type { FieldTrip, EventCategory, UniversalStatus } from "../types";

const eventCategoryLabels: Record<EventCategory, string> = {
  educational: "Educational",
  social: "Social",
  coop: "Co-op",
};

const eventCategoryIcons: Record<
  EventCategory,
  keyof typeof Ionicons.glyphMap
> = {
  educational: "school",
  social: "people",
  coop: "library",
};

const getStatusColors = (
  colors: ColorTheme,
): Record<UniversalStatus, { bg: string; text: string }> => ({
  not_started: { bg: colors.surfaceSecondary, text: colors.primary },
  in_progress: {
    bg: colors.warningLight || colors.surfaceSecondary,
    text: colors.warning || colors.primary,
  },
  completed: { bg: colors.successLight, text: colors.success },
  cancelled: { bg: colors.errorLight, text: colors.error },
});

const statusLabels: Record<UniversalStatus, string> = {
  not_started: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface FieldTripCardProps {
  fieldTrip: FieldTrip;
  onPress?: () => void;
}

export function FieldTripCard({ fieldTrip, onPress }: FieldTripCardProps) {
  const colors = useColors();
  const statusColors = getStatusColors(colors);
  const statusStyle =
    statusColors[fieldTrip.status] || statusColors.not_started;
  const icon = eventCategoryIcons[fieldTrip.eventCategory] || "calendar";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primaryLight,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            {fieldTrip.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
              gap: 4,
            }}
          >
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {fieldTrip.location}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
              gap: 4,
            }}
          >
            <Ionicons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {format(parseISO(fieldTrip.date), "EEE, MMM d, yyyy")}
              {fieldTrip.startTime && ` at ${fieldTrip.startTime}`}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.primary }}>
              {eventCategoryLabels[fieldTrip.eventCategory]}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusStyle.bg,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: statusStyle.text,
              }}
            >
              {statusLabels[fieldTrip.status]}
            </Text>
          </View>
        </View>
        {fieldTrip.cost && (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            ${fieldTrip.cost.toFixed(2)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
