import { View, Text, ViewStyle } from 'react-native'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
  size?: BadgeSize
  style?: ViewStyle
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#f3f4f6', text: '#6b7280' },
  primary: { bg: '#fdf4ff', text: '#d946ef' },
  secondary: { bg: '#e0f2fe', text: '#0284c7' },
  success: { bg: '#dcfce7', text: '#22c55e' },
  warning: { bg: '#fef3c7', text: '#f59e0b' },
  danger: { bg: '#fee2e2', text: '#ef4444' },
  info: { bg: '#dbeafe', text: '#3b82f6' },
}

const sizeStyles: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: 6, paddingV: 2, fontSize: 11 },
  md: { paddingH: 8, paddingV: 3, fontSize: 12 },
}

export function Badge({ children, variant = 'default', size = 'md', style }: BadgeProps) {
  const colors = variantStyles[variant]
  const sizes = sizeStyles[size]

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: sizes.paddingH,
        paddingVertical: sizes.paddingV,
        borderRadius: 4,
        ...style,
      }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={children}
    >
      <Text style={{ fontSize: sizes.fontSize, color: colors.text, fontWeight: '500' }}>
        {children}
      </Text>
    </View>
  )
}
