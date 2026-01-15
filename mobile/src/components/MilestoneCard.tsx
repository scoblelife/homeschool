import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../theme/createStyles";
import type { ColorTheme } from "../theme/colors";
import type { Milestone, Subject } from "../types";

const getStatusColors = (colors: ColorTheme) => ({
  not_started: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  in_progress: { bg: colors.warningLight, text: colors.warning },
  completed: { bg: colors.successLight, text: colors.success },
});

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

interface MilestoneCardProps {
  milestone: Milestone;
  subject?: Subject;
  onPress?: () => void;
}

export function MilestoneCard({
  milestone,
  subject,
  onPress,
}: MilestoneCardProps) {
  const colors = useColors();
  const statusColors = getStatusColors(colors);
  const statusStyle = statusColors[milestone.status];

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            {milestone.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {subject && (
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.primary }}>
                  {subject.name}
                </Text>
              </View>
            )}
            {milestone.category && (
              <View
                style={{
                  backgroundColor: colors.surfaceSecondary,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.text }}>
                  {milestone.category}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {milestone.starValue}
          </Text>
        </View>
      </View>

      {milestone.description && (
        <Text
          style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}
          numberOfLines={2}
        >
          {milestone.description}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <View
          style={{
            backgroundColor: statusStyle.bg,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{ fontSize: 12, color: statusStyle.text, fontWeight: "500" }}
          >
            {statusLabels[milestone.status]}
          </Text>
        </View>

        {milestone.targetDate && (
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            Target: {milestone.targetDate}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
