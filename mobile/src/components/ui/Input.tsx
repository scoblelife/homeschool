import { TextInput, View, Text, TextInputProps, ViewStyle } from 'react-native'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  return (
    <View style={{ marginBottom: 16, ...containerStyle }} accessible={false}>
      {label && (
        <Text
          style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#9ca3af"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: '#1f2937',
          borderWidth: error ? 1 : 0,
          borderColor: error ? '#ef4444' : 'transparent',
        }}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityState={{ disabled: props.editable === false }}
        {...props}
      />
      {error && (
        <Text
          style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  )
}

interface TextAreaProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  rows?: number
  containerStyle?: ViewStyle
}

export function TextArea({ label, error, rows = 3, containerStyle, ...props }: TextAreaProps) {
  return (
    <View style={{ marginBottom: 16, ...containerStyle }} accessible={false}>
      {label && (
        <Text
          style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: '#1f2937',
          minHeight: rows * 24 + 24,
          borderWidth: error ? 1 : 0,
          borderColor: error ? '#ef4444' : 'transparent',
        }}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        accessibilityState={{ disabled: props.editable === false }}
        {...props}
      />
      {error && (
        <Text
          style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  )
}
