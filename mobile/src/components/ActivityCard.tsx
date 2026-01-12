import { View, Text, TouchableOpacity } from 'react-native'
import { format } from 'date-fns'
import type { Activity, Subject } from '../types'

const activityTypeLabels: Record<string, string> = {
  worksheet: 'Worksheet',
  video: 'Video',
  reading: 'Reading',
  writing_print: 'Print Writing',
  writing_cursive: 'Cursive Writing',
  hands_on: 'Hands-On',
  game: 'Game',
  assessment: 'Assessment',
  field_trip: 'Field Trip',
}

interface ActivityCardProps {
  activity: Activity
  subject?: Subject
  onPress?: () => void
}

export function ActivityCard({ activity, subject, onPress }: ActivityCardProps) {
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
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{activity.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
            {subject && (
              <View style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 12, color: '#d946ef' }}>{subject.name}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 12, color: '#0284c7' }}>{activityTypeLabels[activity.activityType]}</Text>
            </View>
          </View>
        </View>
        {activity.durationMinutes && (
          <Text style={{ fontSize: 12, color: '#6b7280' }}>{activity.durationMinutes} min</Text>
        )}
      </View>
      {activity.grade !== null && activity.maxGrade !== null && (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            Grade: {activity.grade}/{activity.maxGrade} ({Math.round((activity.grade / activity.maxGrade) * 100)}%)
          </Text>
        </View>
      )}
      {activity.notes && (
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }} numberOfLines={2}>
          {activity.notes}
        </Text>
      )}
    </TouchableOpacity>
  )
}
