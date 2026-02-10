import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { useStore } from '../../src/stores/useStore'
import {
  getActivities,
  getSuggestedMilestones,
  getUpcomingFieldTrips,
  getActivitySummary,
} from '../../src/database'
import type { Activity, Milestone, FieldTrip } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { ActivityCard } from '../../src/components/ActivityCard'
import { MilestoneCard } from '../../src/components/MilestoneCard'
import { useDeviceType } from '../../src/hooks/useDeviceType'
import { useColors } from '../../src/theme/createStyles'

export default function TodayScreen() {
  const { selectedStudentId, getSelectedStudent, getSubjectById, students } = useStore()
  const [todayActivities, setTodayActivities] = useState<Activity[]>([])
  const [suggestedMilestones, setSuggestedMilestones] = useState<Milestone[]>([])
  const [upcomingTrip, setUpcomingTrip] = useState<FieldTrip | null>(null)
  const [weekStats, setWeekStats] = useState({ activities: 0, hours: 0, subjects: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const selectedStudent = getSelectedStudent()
  const { isTablet } = useDeviceType()
  const colors = useColors()

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayDisplay = format(new Date(), 'EEEE, MMMM d')

  const loadData = useCallback(async () => {
    if (!selectedStudentId) return

    try {
      // Get this week's date range
      const now = new Date()
      const dayOfWeek = now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek)
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      const [activities, milestones, trips, summary] = await Promise.all([
        getActivities({ studentId: selectedStudentId, startDate: today, endDate: today }),
        getSuggestedMilestones(selectedStudentId, 3),
        getUpcomingFieldTrips(selectedStudentId, 1),
        getActivitySummary(selectedStudentId, weekStartStr, today),
      ])

      setTodayActivities(activities)
      setSuggestedMilestones(milestones)
      setUpcomingTrip(trips.length > 0 ? trips[0] : null)

      // Calculate week stats
      const totalActivities = summary.reduce((sum, s) => sum + s.totalActivities, 0)
      const totalMinutes = summary.reduce((sum, s) => sum + s.totalMinutes, 0)
      setWeekStats({
        activities: totalActivities,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        subjects: summary.length,
      })
    } catch (err) {
      console.error('Failed to load today data:', err)
    }
  }, [selectedStudentId, today])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  if (students.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: colors.textSecondary, textAlign: 'center' }}>
          No students yet. Add a student in Settings to get started.
        </Text>
      </View>
    )
  }

  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  // Compliance health: simple green/yellow based on this week's activity
  const isOnTrack = weekStats.activities >= 3 || weekStats.hours >= 2
  const healthColor = isOnTrack ? colors.success : colors.warning
  const healthLabel = isOnTrack ? 'On track' : 'Light week'

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: isTablet ? 24 : 16, maxWidth: isTablet ? 800 : undefined, alignSelf: 'center', width: '100%' }}>
          {/* Date + Student + Health */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }} accessibilityRole="header">{todayDisplay}</Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: healthColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
              accessible
              accessibilityLabel={`Compliance status: ${healthLabel}`}
              accessibilityRole="text"
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: healthColor }} />
              <Text style={{ fontSize: 12, fontWeight: '500', color: healthColor }}>{healthLabel}</Text>
            </View>
          </View>

          <StudentSelector />

          {/* This Week Stats */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }} accessible accessibilityLabel={`${weekStats.activities} activities this week`}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{weekStats.activities}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Activities</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }} accessible accessibilityLabel={`${weekStats.hours} hours this week`}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{weekStats.hours}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Hours</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }} accessible accessibilityLabel={`${weekStats.subjects} subjects this week`}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{weekStats.subjects}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Subjects</Text>
            </View>
          </View>

          {/* Upcoming Event Banner */}
          {upcomingTrip && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/field-trips')}
              style={{
                marginTop: 16,
                backgroundColor: colors.warningLight,
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="calendar" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400e' }}>{upcomingTrip.title}</Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>
                  {upcomingTrip.date === today ? 'Today' : format(new Date(upcomingTrip.date + 'T12:00:00'), 'EEE, MMM d')}
                  {upcomingTrip.startTime && ` at ${upcomingTrip.startTime}`}
                  {upcomingTrip.location && ` · ${upcomingTrip.location}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#b45309" />
            </TouchableOpacity>
          )}

          {/* Today's Activities */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} accessibilityRole="header">Today's Activities</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/log' as any)}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: studentColor }}>+ Log</Text>
              </TouchableOpacity>
            </View>

            {todayActivities.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/log' as any)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                }}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.border} />
                <Text style={{ color: colors.textTertiary, fontSize: 15, marginTop: 8 }}>Nothing logged yet</Text>
                <Text style={{ color: studentColor, fontSize: 14, fontWeight: '500', marginTop: 4 }}>Tap to log an activity</Text>
              </TouchableOpacity>
            ) : (
              todayActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  subject={getSubjectById(activity.subjectId)}
                />
              ))
            )}
          </View>

          {/* Focus On (Suggested Milestones) */}
          {suggestedMilestones.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} accessibilityRole="header">Focus On</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/milestones')}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: studentColor }}>All</Text>
                </TouchableOpacity>
              </View>
              {suggestedMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  subject={getSubjectById(milestone.subjectId)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
