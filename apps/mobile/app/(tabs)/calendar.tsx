import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getActivities, getFieldTrips } from '../../src/database'
import type { Activity, FieldTrip, EventCategory, UniversalStatus } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, EmptyState } from '../../src/components/ui'
import { useColors } from '../../src/theme/createStyles'

const activityTypeIcons: Record<string, string> = {
  worksheet: '',
  video: '',
  reading: '',
  writing: '',
  hands_on: '',
  interactive: '',
}

function useEventCategoryColors(): Record<EventCategory, { bg: string; color: string; icon: string }> {
  const colors = useColors()
  return {
    educational: { bg: colors.warningLight, color: colors.warning, icon: '' },
    social: { bg: colors.successLight, color: colors.studentGreen, icon: '' },
    coop: { bg: colors.primaryLight, color: colors.studentBlue, icon: '' },
  }
}

const statusLabels: Record<UniversalStatus, string> = {
  not_started: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function CalendarScreen() {
  const { selectedStudentId, getSelectedStudent, students, getSubjectById } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const colors = useColors()
  const eventCategoryColors = useEventCategoryColors()

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  const { calendarDays, startDateStr, endDateStr } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return {
      calendarDays: eachDayOfInterval({ start: calStart, end: calEnd }),
      startDateStr: format(calStart, 'yyyy-MM-dd'),
      endDateStr: format(calEnd, 'yyyy-MM-dd'),
    }
  }, [currentMonth])

  const loadData = useCallback(async () => {
    try {
      const [activitiesData, fieldTripsData] = await Promise.all([
        getActivities({
          studentId: selectedStudentId || undefined,
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        getFieldTrips(selectedStudentId ? { studentId: selectedStudentId } : undefined),
      ])

      setActivities(activitiesData)
      // Filter field trips to current date range
      const filteredTrips = fieldTripsData.filter((trip) => trip.date >= startDateStr && trip.date <= endDateStr)
      setFieldTrips(filteredTrips)
    } catch (err) {
      console.error('Failed to load calendar data:', err)
    }
  }, [selectedStudentId, startDateStr, endDateStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const getEventsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayActivities = activities.filter((a) => a.dateCompleted === dateStr)
      const dayFieldTrips = fieldTrips.filter((t) => t.date === dateStr)
      return { activities: dayActivities, fieldTrips: dayFieldTrips }
    },
    [activities, fieldTrips]
  )

  const selectedDayEvents = useMemo(() => getEventsForDay(selectedDate), [selectedDate, getEventsForDay])

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Month Navigation */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                style={{ padding: 8 }}
                accessibilityLabel="Previous month"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={goToToday} accessibilityLabel={`${format(currentMonth, 'MMMM yyyy')}, tap to go to today`}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                style={{ padding: 8 }}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textTertiary }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays.map((day) => {
                const events = getEventsForDay(day)
                const hasEvents = events.activities.length > 0 || events.fieldTrips.length > 0
                const hasFieldTrip = events.fieldTrips.length > 0
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                // Get background color based on events
                let bgColor = 'transparent'
                if (isSelected) {
                  bgColor = studentColor
                } else if (isToday) {
                  bgColor = colors.warningLight
                } else if (hasFieldTrip && isCurrentMonth) {
                  const category = events.fieldTrips[0].eventCategory || 'educational'
                  bgColor = eventCategoryColors[category]?.bg || colors.warningLight
                }

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    onPress={() => setSelectedDate(day)}
                    accessibilityLabel={`${format(day, 'MMMM d')}${isToday ? ', today' : ''}${hasEvents ? ', has events' : ''}`}
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      width: '14.28%',
                      aspectRatio: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: bgColor,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isToday || isSelected ? '600' : '400',
                        color: isSelected ? colors.textInverse : !isCurrentMonth ? colors.border : isToday ? studentColor : colors.text,
                      }}
                    >
                      {format(day, 'd')}
                    </Text>

                    {/* Event Dots */}
                    {hasEvents && isCurrentMonth && !isSelected && (
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                        {events.fieldTrips.slice(0, 2).map((trip, i) => {
                          const category = trip.eventCategory || 'educational'
                          return (
                            <View
                              key={i}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: eventCategoryColors[category]?.color || colors.warning,
                              }}
                            />
                          )
                        })}
                        {events.activities.length > 0 && (
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: colors.success,
                            }}
                          />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </Card>

          {/* Legend */}
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Activities</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Educational</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.studentGreen }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Social</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.studentBlue }} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Co-op</Text>
            </View>
          </View>

          {/* Selected Day Details */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} accessibilityRole="header">
                {format(selectedDate, 'EEEE, MMMM d')}
              </Text>
              {isSameDay(selectedDate, new Date()) && (
                <Badge variant="primary">Today</Badge>
              )}
            </View>

            {/* Field Trips */}
            {selectedDayEvents.fieldTrips.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>
                  Events ({selectedDayEvents.fieldTrips.length})
                </Text>
                {selectedDayEvents.fieldTrips.map((trip) => {
                  const category = trip.eventCategory || 'educational'
                  const categoryColors = eventCategoryColors[category] || eventCategoryColors.educational
                  const tripStudents = students.filter((s) => trip.studentIds.includes(s.id))

                  return (
                    <View
                      key={trip.id}
                      style={{
                        backgroundColor: categoryColors.bg,
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16 }}>{categoryColors.icon}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: categoryColors.color, flex: 1 }}>
                          {trip.title}
                        </Text>
                        <Badge
                          variant={trip.status === 'completed' ? 'success' : trip.status === 'cancelled' ? 'default' : 'primary'}
                        >
                          {statusLabels[trip.status]}
                        </Badge>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                        <Ionicons name="location" size={14} color={categoryColors.color} />
                        <Text style={{ fontSize: 13, color: categoryColors.color }}>{trip.location}</Text>
                      </View>
                      {tripStudents.length > 0 && (
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                          {tripStudents.map((s) => s.name).join(', ')}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>
            )}

            {/* Activities */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>
                Activities ({selectedDayEvents.activities.length})
              </Text>

              {selectedDayEvents.activities.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' }}>No activities logged</Text>
              ) : (
                selectedDayEvents.activities.map((activity) => {
                  const student = students.find((s) => s.id === activity.studentId)
                  const subject = getSubjectById(activity.subjectId)
                  const icon = activityTypeIcons[activity.activityType] || ''

                  return (
                    <View
                      key={activity.id}
                      style={{
                        backgroundColor: colors.successLight,
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16 }}>{icon}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, flex: 1 }}>
                          {activity.title}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {student && (
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{student.name}</Text>
                        )}
                        {subject && (
                          <>
                            <Text style={{ fontSize: 12, color: colors.border }}>•</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{subject.name}</Text>
                          </>
                        )}
                        {activity.durationMinutes && (
                          <>
                            <Text style={{ fontSize: 12, color: colors.border }}>•</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{activity.durationMinutes} min</Text>
                          </>
                        )}
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  )
}
