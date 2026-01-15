import { View, Text, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { useColors } from "../theme/createStyles";
import type { Activity, Subject } from "../types";

const activityTypeLabels: Record<string, string> = {
  worksheet: "Worksheet",
  video: "Video",
  reading: "Reading",
  writing_print: "Print Writing",
  writing_cursive: "Cursive Writing",
  hands_on: "Hands-On",
  game: "Game",
  assessment: "Assessment",
  field_trip: "Field Trip",
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
                {activityTypeLabels[activity.activityType]}
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
