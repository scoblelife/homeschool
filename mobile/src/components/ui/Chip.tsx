import { TouchableOpacity, Text, ViewStyle } from 'react-native'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  color?: string
  disabled?: boolean
  style?: ViewStyle
}

export function Chip({
  label,
  selected = false,
  onPress,
  color = '#d946ef',
  disabled = false,
  style,
}: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: selected ? color : '#f3f4f6',
        borderWidth: selected ? 0 : 1,
        borderColor: '#e5e7eb',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: selected ? '#fff' : '#6b7280',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

interface ChipGroupProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function ChipGroup({ children, style }: ChipGroupProps) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        ...style,
      }}
    >
      {children}
    </TouchableOpacity>
  )
}
