import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Milestone, Subject } from '../types'

const statusColors = {
  not_started: { bg: '#f3f4f6', text: '#6b7280' },
  in_progress: { bg: '#fef3c7', text: '#d97706' },
  completed: { bg: '#d1fae5', text: '#059669' },
}

const statusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

interface MilestoneCardProps {
  milestone: Milestone
  subject?: Subject
  onPress?: () => void
}

export function MilestoneCard({ milestone, subject, onPress }: MilestoneCardProps) {
  const statusStyle = statusColors[milestone.status]

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{milestone.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
            {subject && (
              <View style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 12, color: '#d946ef' }}>{subject.name}</Text>
              </View>
            )}
            {milestone.category && (
              <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 12, color: '#0284c7' }}>{milestone.category}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>{milestone.starValue}</Text>
        </View>
      </View>

      {milestone.description && (
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }} numberOfLines={2}>
          {milestone.description}
        </Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <View
          style={{
            backgroundColor: statusStyle.bg,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: statusStyle.text, fontWeight: '500' }}>
            {statusLabels[milestone.status]}
          </Text>
        </View>

        {milestone.targetDate && (
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Target: {milestone.targetDate}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}
