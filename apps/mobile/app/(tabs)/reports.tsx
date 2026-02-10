import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO, subDays, startOfMonth } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getActivitySummary, getDailySummaries } from '../../src/database'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, EmptyState, ProgressBar } from '../../src/components/ui'
import { useColors } from '../../src/theme/createStyles'

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
  sessionsCount: number
  activitiesCount: number
  totalMinutes: number
}

const quickRanges = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
]

export default function ReportsScreen() {
  const { selectedStudentId, getSelectedStudent } = useStore()
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRange, setSelectedRange] = useState(30)

  const colors = useColors()
  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  const loadReports = useCallback(async () => {
    if (!selectedStudentId) {
      setActivitySummary([])
      setDailySummaries([])
      return
    }

    try {
      const [summary, daily] = await Promise.all([
        getActivitySummary(selectedStudentId, dateRange.startDate, dateRange.endDate),
        getDailySummaries(selectedStudentId, dateRange.startDate, dateRange.endDate),
      ])
      setActivitySummary(summary)
      setDailySummaries(daily)
    } catch (err) {
      console.error('Failed to load reports:', err)
    }
  }, [selectedStudentId, dateRange])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadReports()
    setRefreshing(false)
  }, [loadReports])

  const setRange = (days: number) => {
    setSelectedRange(days)
    setDateRange({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  const stats = useMemo(() => {
    const totalActivities = activitySummary.reduce((sum, s) => sum + s.totalActivities, 0)
    const totalMinutes = activitySummary.reduce((sum, s) => sum + s.totalMinutes, 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const activeDays = dailySummaries.length
    return { totalActivities, totalMinutes, totalHours, activeDays }
  }, [activitySummary, dailySummaries])

  if (!selectedStudentId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16 }}>
          <StudentSelector />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <EmptyState
            icon="person"
            title="Select a Student"
            description="Choose a student above to view their reports"
          />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Date Range Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quickRanges.map((range) => (
                <TouchableOpacity
                  key={range.days}
                  onPress={() => setRange(range.days)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedRange === range.days }}
                  accessibilityLabel={`${range.label} date range`}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedRange === range.days ? studentColor : colors.surfaceSecondary,
                  }}
                >
                  <Text
                    style={{
                      color: selectedRange === range.days ? colors.textInverse : colors.textSecondary,
                      fontWeight: '500',
                    }}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Summary Stats */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Card style={{ flex: 1 }} accessibilityLabel={`${stats.totalActivities} total activities`}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Activities</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{stats.totalActivities}</Text>
              </Card>
              <Card style={{ flex: 1 }} accessibilityLabel={`${stats.totalHours} total hours`}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Hours</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{stats.totalHours}</Text>
              </Card>
              <Card style={{ flex: 1 }} accessibilityLabel={`${stats.activeDays} active days`}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Active Days</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{stats.activeDays}</Text>
              </Card>
            </View>
          </View>

          {/* Subject Breakdown */}
          <Card style={{ marginTop: 16 }}>
            <Text accessibilityRole="header" style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>By Subject</Text>

            {activitySummary.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' }}>
                No activities in this date range
              </Text>
            ) : (
              <View style={{ gap: 16 }}>
                {activitySummary.map((summary) => {
                  const percentage = stats.totalMinutes > 0 ? (summary.totalMinutes / stats.totalMinutes) * 100 : 0
                  const hours = Math.round((summary.totalMinutes / 60) * 10) / 10

                  return (
                    <View key={summary.subjectId}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>{summary.subjectName}</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                          {summary.totalActivities} activities • {hours} hrs
                        </Text>
                      </View>
                      <ProgressBar progress={percentage} color={studentColor} height={6} />

                      {/* Activity type breakdown */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {Object.entries(summary.byType).map(([type, count]) => {
                            if (count === 0) return null
                            return (
                              <Badge key={type} variant="default">
                                {`${type.replace('_', ' ')}: ${count}`}
                              </Badge>
                            )
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  )
                })}
              </View>
            )}
          </Card>

          {/* Daily Activity */}
          <Card style={{ marginTop: 16 }}>
            <Text accessibilityRole="header" style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Daily Activity</Text>

            {dailySummaries.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' }}>
                No activity in this date range
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {dailySummaries.slice(0, 14).map((day) => (
                  <View
                    key={day.date}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                        {format(parseISO(day.date), 'EEE, MMM d')}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {day.activitiesCount} activities • {day.totalMinutes} min
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {Array.from({ length: Math.min(day.activitiesCount, 8) }).map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: studentColor,
                          }}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  )
}
