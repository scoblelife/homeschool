import { View, Text, ViewStyle } from 'react-native'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, ViewStyle> = {
  none: { padding: 0 },
  sm: { padding: 8 },
  md: { padding: 12 },
  lg: { padding: 16 },
}

export function Card({ children, padding = 'md', style }: CardProps) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        ...paddingStyles[padding],
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

interface CardHeaderProps {
  children: ReactNode
  style?: ViewStyle
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={{ marginBottom: 12, ...style }}>
      {children}
    </View>
  )
}

interface CardTitleProps {
  children: string
}

export function CardTitle({ children }: CardTitleProps) {
  return (
    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
      {children}
    </Text>
  )
}
