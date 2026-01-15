import { TextInput, View, Text, TextInputProps, ViewStyle } from "react-native";
import { useColors } from "../../theme/createStyles";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16, ...containerStyle }} accessible={false}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 4,
          }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: colors.text,
          borderWidth: error ? 1 : 0,
          borderColor: error ? colors.error : "transparent",
        }}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityState={{ disabled: props.editable === false }}
        {...props}
      />
      {error && (
        <Text
          style={{ fontSize: 12, color: colors.error, marginTop: 4 }}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

interface TextAreaProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  rows?: number;
  containerStyle?: ViewStyle;
}

export function TextArea({
  label,
  error,
  rows = 3,
  containerStyle,
  ...props
}: TextAreaProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16, ...containerStyle }} accessible={false}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 4,
          }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: colors.text,
          minHeight: rows * 24 + 24,
          borderWidth: error ? 1 : 0,
          borderColor: error ? colors.error : "transparent",
        }}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityState={{ disabled: props.editable === false }}
        {...props}
      />
      {error && (
        <Text
          style={{ fontSize: 12, color: colors.error, marginTop: 4 }}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
