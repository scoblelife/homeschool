import { View, Text, ViewStyle } from "react-native";
import { useColors } from "../../theme/createStyles";
import type { ColorTheme } from "../../theme/colors";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const getVariantStyles = (
  colors: ColorTheme,
): Record<BadgeVariant, { bg: string; text: string }> => ({
  default: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  primary: { bg: colors.primaryLight, text: colors.primary },
  secondary: { bg: colors.surfaceSecondary, text: colors.text },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.errorLight, text: colors.error },
  info: { bg: colors.surfaceSecondary, text: colors.primary },
});

const sizeStyles: Record<
  BadgeSize,
  { paddingH: number; paddingV: number; fontSize: number }
> = {
  sm: { paddingH: 6, paddingV: 2, fontSize: 11 },
  md: { paddingH: 8, paddingV: 3, fontSize: 12 },
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  style,
}: BadgeProps) {
  const colors = useColors();
  const variantStyles = getVariantStyles(colors);
  const variantStyle = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <View
      style={{
        backgroundColor: variantStyle.bg,
        paddingHorizontal: sizes.paddingH,
        paddingVertical: sizes.paddingV,
        borderRadius: 4,
        ...style,
      }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={children}
    >
      <Text
        style={{
          fontSize: sizes.fontSize,
          color: variantStyle.text,
          fontWeight: "500",
        }}
      >
        {children}
      </Text>
    </View>
  );
}
