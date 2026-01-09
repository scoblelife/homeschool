import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onPress: () => void
  children: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  color?: string
  style?: ViewStyle
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: '#d946ef' },
    text: { color: '#fff' },
  },
  secondary: {
    container: { backgroundColor: '#f3f4f6' },
    text: { color: '#374151' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#d1d5db' },
    text: { color: '#374151' },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: '#6b7280' },
  },
  danger: {
    container: { backgroundColor: '#ef4444' },
    text: { color: '#fff' },
  },
}

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
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
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  color,
  style,
}: ButtonProps) {
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  const containerStyle: ViewStyle = {
    ...variantStyle.container,
    ...sizeStyle.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
    ...(color && variant === 'primary' && { backgroundColor: color }),
    ...(color && variant === 'outline' && { borderColor: color }),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  }

  const textStyle: TextStyle = {
    ...variantStyle.text,
    ...sizeStyle.text,
    fontWeight: '600',
    ...(color && variant === 'outline' && { color }),
    ...(color && variant === 'ghost' && { color }),
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textStyle.color as string} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  )
}
