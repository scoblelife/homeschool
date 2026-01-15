import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useColors } from "../theme/createStyles";
import type { ColorTheme } from "../theme/colors";
import type { FieldTrip } from "../types";

const activityTypeLabels: Record<string, string> = {
  field_trip: "Field Trip",
  park_day: "Park Day",
  game_night: "Game Night",
  playdate: "Playdate",
  coop_class: "Co-op Class",
  custom: "Custom Event",
};

const activityTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  field_trip: "bus",
  park_day: "leaf",
  game_night: "game-controller",
  playdate: "people",
  coop_class: "school",
  custom: "calendar",
};

const getStatusColors = (
  colors: ColorTheme,
): Record<string, { bg: string; text: string }> => ({
  planned: { bg: colors.surfaceSecondary, text: colors.primary },
  completed: { bg: colors.successLight, text: colors.success },
  cancelled: { bg: colors.errorLight, text: colors.error },
});

interface FieldTripCardProps {
  fieldTrip: FieldTrip;
  onPress?: () => void;
}

export function FieldTripCard({ fieldTrip, onPress }: FieldTripCardProps) {
  const colors = useColors();
  const statusColors = getStatusColors(colors);
  const statusStyle = statusColors[fieldTrip.status];
  const icon = activityTypeIcons[fieldTrip.activityType] || "calendar";

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
              {activityTypeLabels[fieldTrip.activityType]}
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
                textTransform: "capitalize",
              }}
            >
              {fieldTrip.status}
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
