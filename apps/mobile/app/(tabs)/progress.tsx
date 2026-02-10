import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, subDays, startOfWeek } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import {
  getActivitySummary,
  getDailySummaries,
  getMilestones,
  getStudentStarTotals,
} from '../../src/database'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, EmptyState, ProgressBar } from '../../src/components/ui'
import type { Milestone, UniversalStatus } from '../../src/types'

interface ActivitySummary {
  subjectId: string
  subjectName: string
  totalActivities: number
  totalMinutes: number
  averageGrade: number | null
  byType: Record<string, number>
}

interface DailySummary {
  date: string
  activitiesCount: number
  totalMinutes: number
}

export default function ProgressScreen() {
  const { selectedStudentId, getSelectedStudent, getSubjectById } = useStore()
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [starTotals, setStarTotals] = useState({ weeklyTotal: 0, allTimeTotal: 0 })
  const [refreshing, setRefreshing] = useState(false)

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const loadData = useCallback(async () => {
    if (!selectedStudentId) return

    try {
      const [summary, daily, milestonesData, stars] = await Promise.all([
        getActivitySummary(selectedStudentId, weekStart, today),
        getDailySummaries(selectedStudentId, thirtyDaysAgo, today),
        getMilestones(selectedStudentId),
        getStudentStarTotals(selectedStudentId),
      ])

      setActivitySummary(summary)
      setDailySummaries(daily)
      setMilestones(milestonesData)
      setStarTotals(stars)
    } catch (err) {
      console.error('Failed to load progress data:', err)
    }
  }, [selectedStudentId, weekStart, today, thirtyDaysAgo])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  // Week stats
  const weekStats = useMemo(() => {
    const totalActivities = activitySummary.reduce((sum, s) => sum + s.totalActivities, 0)
    const totalMinutes = activitySummary.reduce((sum, s) => sum + s.totalMinutes, 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const subjectsCovered = activitySummary.length
    // Active days this week
    const weekDays = dailySummaries.filter((d) => d.date >= weekStart)
    return { totalActivities, totalMinutes, totalHours, subjectsCovered, activeDays: weekDays.length }
  }, [activitySummary, dailySummaries, weekStart])

  // Compliance health
  const isOnTrack = weekStats.totalActivities >= 3 || weekStats.totalHours >= 2
  const healthColor = isOnTrack ? '#10b981' : '#f59e0b'

  // Milestone stats
  const milestoneStats = useMemo(() => {
    const total = milestones.length
    const completed = milestones.filter((m) => m.status === 'completed').length
    const inProgress = milestones.filter((m) => m.status === 'in_progress').length
    return { total, completed, inProgress, progress: total > 0 ? (completed / total) * 100 : 0 }
  }, [milestones])

  // Weekly wins
  const weeklyWins = useMemo(() => {
    const wins: string[] = []
    if (weekStats.subjectsCovered >= 5) wins.push(`Covered ${weekStats.subjectsCovered} subjects`)
    else if (weekStats.subjectsCovered >= 3) wins.push(`Covered ${weekStats.subjectsCovered} subjects`)
    if (weekStats.totalActivities >= 10) wins.push(`${weekStats.totalActivities} activities logged`)
    else if (weekStats.totalActivities >= 5) wins.push(`${weekStats.totalActivities} activities logged`)
    if (weekStats.activeDays >= 5) wins.push(`Active ${weekStats.activeDays} days this week`)
    else if (weekStats.activeDays >= 3) wins.push(`Active ${weekStats.activeDays} days`)
    if (starTotals.weeklyTotal > 0) wins.push(`${starTotals.weeklyTotal} star${starTotals.weeklyTotal > 1 ? 's' : ''} earned`)

    const completedThisWeek = milestones.filter(
      (m) => m.status === 'completed' && m.completedDate && m.completedDate >= weekStart
    ).length
    if (completedThisWeek > 0) wins.push(`${completedThisWeek} milestone${completedThisWeek > 1 ? 's' : ''} completed`)

    return wins
  }, [weekStats, starTotals, milestones, weekStart])

  if (!selectedStudentId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ padding: 16 }}>
          <StudentSelector />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <EmptyState
            icon="person"
            title="Select a Student"
            description="Choose a student to view their progress"
          />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Compliance Health Bar */}
          <View style={{
            marginTop: 16,
            backgroundColor: healthColor + '15',
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: healthColor }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: healthColor }}>
                {isOnTrack ? 'On track this week' : 'Light week so far'}
              </Text>
              <Text style={{ fontSize: 12, color: healthColor, opacity: 0.8 }}>
                {weekStats.totalHours} hrs across {weekStats.subjectsCovered} subjects · {weekStats.activeDays} active days
              </Text>
            </View>
          </View>

          {/* This Week Stats */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937' }}>{weekStats.totalActivities}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Activities</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937' }}>{weekStats.totalHours}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Hours</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937' }}>{weekStats.activeDays}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Days</Text>
            </Card>
          </View>

          {/* Weekly Wins */}
          {weeklyWins.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="trophy" size={18} color="#f59e0b" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>Weekly Wins</Text>
              </View>
              {weeklyWins.map((win, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={{ fontSize: 14, color: '#374151' }}>{win}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Stars */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={{ fontSize: 22, fontWeight: '700', color: studentColor }}>{starTotals.weeklyTotal}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>This Week</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={{ fontSize: 22, fontWeight: '700', color: studentColor }}>{starTotals.allTimeTotal}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>All Time</Text>
              </View>
            </View>
          </Card>

          {/* Milestone Progress */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>Milestones</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                {milestoneStats.completed}/{milestoneStats.total} completed
              </Text>
            </View>
            <ProgressBar progress={milestoneStats.progress} color={studentColor} showLabel />

            {milestoneStats.inProgress > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>In Progress</Text>
                {milestones
                  .filter((m) => m.status === 'in_progress')
                  .slice(0, 5)
                  .map((milestone) => {
                    const subject = getSubjectById(milestone.subjectId)
                    return (
                      <View key={milestone.id} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                      }}>
                        <Ionicons name="ellipse" size={6} color={studentColor} />
                        <Text style={{ fontSize: 13, color: '#374151', flex: 1 }} numberOfLines={1}>{milestone.title}</Text>
                        {subject && (
                          <Text style={{ fontSize: 11, color: '#9ca3af' }}>{subject.name}</Text>
                        )}
                      </View>
                    )
                  })
                }
              </View>
            )}
          </Card>

          {/* Subject Breakdown (last 30 days) */}
          {activitySummary.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>By Subject (This Week)</Text>
              <View style={{ gap: 14 }}>
                {activitySummary.map((summary) => {
                  const percentage = weekStats.totalMinutes > 0 ? (summary.totalMinutes / weekStats.totalMinutes) * 100 : 0
                  const hours = Math.round((summary.totalMinutes / 60) * 10) / 10

                  return (
                    <View key={summary.subjectId}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>{summary.subjectName}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>
                          {summary.totalActivities} · {hours} hrs
                        </Text>
                      </View>
                      <ProgressBar progress={percentage} color={studentColor} height={6} />
                    </View>
                  )
                })}
              </View>
            </Card>
          )}

          {/* Daily Activity (last 7 days) */}
          {dailySummaries.length > 0 && (
            <Card style={{ marginTop: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>Recent Days</Text>
              <View style={{ gap: 8 }}>
                {dailySummaries.slice(0, 7).map((day) => (
                  <View
                    key={day.date}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#f9fafb',
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#1f2937' }}>
                      {format(new Date(day.date + 'T12:00:00'), 'EEE, MMM d')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        {day.activitiesCount} · {day.totalMinutes} min
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {Array.from({ length: Math.min(day.activitiesCount, 6) }).map((_, i) => (
                          <View
                            key={i}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor: studentColor,
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
