import { TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FABProps {
  onPress: () => void
  icon?: keyof typeof Ionicons.glyphMap
  color?: string
  style?: ViewStyle
}

export function FAB({ onPress, icon = 'add', color = '#d946ef', style }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        ...style,
      }}
    >
      <Ionicons name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  )
}
