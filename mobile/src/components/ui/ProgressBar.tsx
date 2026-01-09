import { View, Text, ViewStyle } from 'react-native'

interface ProgressBarProps {
  progress: number // 0-100
  color?: string
  height?: number
  showLabel?: boolean
  label?: string
  style?: ViewStyle
}

export function ProgressBar({
  progress,
  color = '#10b981',
  height = 8,
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <View style={style}>
      <View
        style={{
          height,
          backgroundColor: '#e5e7eb',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
            width: `${clampedProgress}%`,
          }}
        />
      </View>
      {showLabel && (
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {label || `${Math.round(clampedProgress)}%`}
        </Text>
      )}
    </View>
  )
}
