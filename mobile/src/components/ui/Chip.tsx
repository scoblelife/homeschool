import { TouchableOpacity, Text, ViewStyle } from "react-native";
import { useColors } from "../../theme/createStyles";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  color,
  disabled = false,
  style,
}: ChipProps) {
  const colors = useColors();
  const chipColor = color || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: selected ? chipColor : colors.surfaceSecondary,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: selected ? colors.textInverse : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface ChipGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ChipGroup({ children, style }: ChipGroupProps) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}
