import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "../theme/createStyles";
import type { Activity, Subject } from "../types";

const activityTypeLabels: Record<string, string> = {
  worksheet: "Worksheet",
  video: "Video",
  reading: "Reading",
  writing: "Writing",
  hands_on: "Hands-On",
  interactive: "Interactive",
};

interface ActivityCardProps {
  activity: Activity;
  subject?: Subject;
  onPress?: () => void;
}

export function ActivityCard({
  activity,
  subject,
  onPress,
}: ActivityCardProps) {
  const colors = useColors();

  // Build display label including sub-type if present
  let typeLabel =
    activityTypeLabels[activity.activityType] || activity.activityType;
  if (activity.activitySubType) {
    const subTypeLabels: Record<string, string> = {
      print: "Print",
      cursive: "Cursive",
      game: "Game",
      test: "Test",
      event: "Event",
    };
    const subLabel = subTypeLabels[activity.activitySubType];
    if (subLabel) {
      typeLabel = `${typeLabel} (${subLabel})`;
    }
  }

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
            {activity.title}
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
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.text }}>
                {typeLabel}
              </Text>
            </View>
          </View>
        </View>
        {activity.durationMinutes && (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {activity.durationMinutes} min
          </Text>
        )}
      </View>
      {activity.grade !== null && activity.maxGrade !== null && (
        <View
          style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Grade: {activity.grade}/{activity.maxGrade} (
            {Math.round((activity.grade / activity.maxGrade) * 100)}%)
          </Text>
        </View>
      )}
      {activity.notes && (
        <Text
          style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}
          numberOfLines={2}
        >
          {activity.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}
