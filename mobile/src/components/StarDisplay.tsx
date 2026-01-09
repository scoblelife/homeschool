import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface StarDisplayProps {
  weeklyStars: number
  totalStars: number
  color?: string
}

export function StarDisplay({ weeklyStars, totalStars, color = '#d946ef' }: StarDisplayProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={24} color="#fbbf24" />
          <Text style={{ fontSize: 24, fontWeight: '700', color }}>{weeklyStars}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>This Week</Text>
      </View>
      <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={24} color="#fbbf24" />
          <Text style={{ fontSize: 24, fontWeight: '700', color }}>{totalStars}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>All Time</Text>
      </View>
    </View>
  )
}
