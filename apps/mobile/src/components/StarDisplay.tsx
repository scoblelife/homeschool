import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../theme/createStyles";

interface StarDisplayProps {
  weeklyStars: number;
  totalStars: number;
  color?: string;
}

export function StarDisplay({
  weeklyStars,
  totalStars,
  color,
}: StarDisplayProps) {
  const colors = useColors();
  const displayColor = color || colors.primary;

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
      <View style={{ alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="star" size={24} color={colors.warning} />
          <Text
            style={{ fontSize: 24, fontWeight: "700", color: displayColor }}
          >
            {weeklyStars}
          </Text>
        </View>
        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}
        >
          This Week
        </Text>
      </View>
      <View style={{ width: 1, backgroundColor: colors.separator }} />
      <View style={{ alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="star" size={24} color={colors.warning} />
          <Text
            style={{ fontSize: 24, fontWeight: "700", color: displayColor }}
          >
            {totalStars}
          </Text>
        </View>
        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}
        >
          All Time
        </Text>
      </View>
    </View>
  );
}
