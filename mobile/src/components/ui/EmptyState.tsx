import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const accessibilityMessage = description ? `${title}. ${description}` : title

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessible
      accessibilityLabel={accessibilityMessage}
      accessibilityRole="text"
    >
      {icon && (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#f3f4f6',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
          accessibilityElementsHidden
        >
          <Ionicons name={icon} size={32} color="#9ca3af" />
        </View>
      )}
      <Text
        style={{ fontSize: 16, fontWeight: '600', color: '#374151', textAlign: 'center' }}
        accessibilityRole="header"
        importantForAccessibility="no"
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}
          importantForAccessibility="no"
        >
          {description}
        </Text>
      )}
      {action && <View style={{ marginTop: 16 }}>{action}</View>}
    </View>
  )
}
