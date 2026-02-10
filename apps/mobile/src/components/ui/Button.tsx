import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColors } from "../../theme/createStyles";
import type { ColorTheme } from "../../theme/colors";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  color?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const getVariantStyles = (
  colors: ColorTheme,
): Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> => ({
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.textInverse },
  },
  secondary: {
    container: { backgroundColor: colors.surfaceSecondary },
    text: { color: colors.text },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.textSecondary },
  },
  danger: {
    container: { backgroundColor: colors.error },
    text: { color: colors.textInverse },
  },
});

const sizeStyles: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  sm: {
    container: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    text: { fontSize: 14 },
  },
  md: {
    container: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    text: { fontSize: 16 },
  },
  lg: {
    container: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
    text: { fontSize: 18 },
  },
};

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  color,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const colors = useColors();
  const variantStyles = getVariantStyles(colors);
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerStyle: ViewStyle = {
    ...variantStyle.container,
    ...sizeStyle.container,
    ...(fullWidth && { width: "100%" }),
    ...(disabled && { opacity: 0.5 }),
    ...(color && variant === "primary" && { backgroundColor: color }),
    ...(color && variant === "outline" && { borderColor: color }),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...style,
  };

  const textStyle: TextStyle = {
    ...variantStyle.text,
    ...sizeStyle.text,
    fontWeight: "600",
    ...(color && variant === "outline" && { color }),
    ...(color && variant === "ghost" && { color }),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textStyle.color as string}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
}
