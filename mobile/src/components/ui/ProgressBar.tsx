import { View, Text, ViewStyle } from "react-native";
import { useColors } from "../../theme/createStyles";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  const colors = useColors();
  const progressColor = color || colors.success;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={style}>
      <View
        style={{
          height,
          backgroundColor: colors.border,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            backgroundColor: progressColor,
            borderRadius: height / 2,
            width: `${clampedProgress}%`,
          }}
        />
      </View>
      {showLabel && (
        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}
        >
          {label || `${Math.round(clampedProgress)}%`}
        </Text>
      )}
    </View>
  );
}
