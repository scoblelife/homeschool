import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO } from 'date-fns'
import type { FieldTrip } from '../types'

const activityTypeLabels: Record<string, string> = {
  field_trip: 'Field Trip',
  park_day: 'Park Day',
  game_night: 'Game Night',
  playdate: 'Playdate',
  coop_class: 'Co-op Class',
  custom: 'Custom Event',
}

const activityTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  field_trip: 'bus',
  park_day: 'leaf',
  game_night: 'game-controller',
  playdate: 'people',
  coop_class: 'school',
  custom: 'calendar',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  planned: { bg: '#dbeafe', text: '#2563eb' },
  completed: { bg: '#d1fae5', text: '#059669' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
}

interface FieldTripCardProps {
  fieldTrip: FieldTrip
  onPress?: () => void
}

export function FieldTripCard({ fieldTrip, onPress }: FieldTripCardProps) {
  const statusStyle = statusColors[fieldTrip.status]
  const icon = activityTypeIcons[fieldTrip.activityType] || 'calendar'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fdf4ff',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={20} color="#d946ef" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{fieldTrip.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={{ fontSize: 13, color: '#6b7280' }}>{fieldTrip.location}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              {format(parseISO(fieldTrip.date), 'EEE, MMM d, yyyy')}
              {fieldTrip.startTime && ` at ${fieldTrip.startTime}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 12, color: '#d946ef' }}>{activityTypeLabels[fieldTrip.activityType]}</Text>
          </View>
          <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 12, color: statusStyle.text, textTransform: 'capitalize' }}>{fieldTrip.status}</Text>
          </View>
        </View>
        {fieldTrip.cost && (
          <Text style={{ fontSize: 12, color: '#6b7280' }}>${fieldTrip.cost.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}
