import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getMilestones, updateMilestone, createReward } from '../../src/database'
import type { Milestone } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, Button, EmptyState, Modal } from '../../src/components/ui'
import { useColors } from '../../src/theme/createStyles'

function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

export default function PlannerScreen() {
  const { selectedStudentId, getSelectedStudent, getSubjectById } = useStore()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => format(getCurrentWeekStart(), 'yyyy-MM-dd'))
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const colors = useColors()
  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  const { weekStartDate, weekEndDate, weekDays, weekEndStr } = useMemo(() => {
    const start = parseISO(currentWeekStart)
    const end = endOfWeek(start, { weekStartsOn: 1 })
    return {
      weekStartDate: start,
      weekEndDate: end,
      weekDays: eachDayOfInterval({ start, end }),
      weekEndStr: format(end, 'yyyy-MM-dd'),
    }
  }, [currentWeekStart])

  const loadMilestones = useCallback(async () => {
    if (!selectedStudentId) {
      setMilestones([])
      return
    }

    try {
      const data = await getMilestones(selectedStudentId)
      // Filter to show in_progress and not_started milestones, plus recently completed ones
      const filtered = data.filter((m) => {
        if (m.status === 'not_started' || m.status === 'in_progress') return true
        // Show completed milestones if completed this week
        if (m.status === 'completed' && m.completedDate) {
          return m.completedDate >= currentWeekStart && m.completedDate <= weekEndStr
        }
        return false
      })
      setMilestones(filtered)
    } catch (err) {
      console.error('Failed to load milestones:', err)
    }
  }, [selectedStudentId, currentWeekStart, weekEndStr])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadMilestones()
    setRefreshing(false)
  }, [loadMilestones])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = parseISO(currentWeekStart)
    const newDate = direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
    setCurrentWeekStart(format(newDate, 'yyyy-MM-dd'))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(format(getCurrentWeekStart(), 'yyyy-MM-dd'))
  }

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      const newStatus = milestone.status === 'completed' ? 'in_progress' : 'completed'
      const updates: { status: typeof newStatus; completedDate?: string } = { status: newStatus }

      if (newStatus === 'completed') {
        updates.completedDate = format(new Date(), 'yyyy-MM-dd')

        // Award stars
        await createReward({
          studentId: milestone.studentId,
          milestoneId: milestone.id,
          starsAwarded: milestone.starValue,
          awardedDate: format(new Date(), 'yyyy-MM-dd'),
          weekStart: currentWeekStart,
          syncedToSkylight: false,
        })

        Alert.alert('Congratulations!', `${milestone.starValue} star${milestone.starValue > 1 ? 's' : ''} earned!`)
      }

      await updateMilestone(milestone.id, updates)
      await loadMilestones()
    } catch (err) {
      console.error('Failed to update milestone:', err)
      Alert.alert('Error', 'Failed to update milestone')
    }
  }

  // Group milestones by subject
  const groupedMilestones = useMemo(() => {
    const grouped: Record<string, Milestone[]> = {}
    for (const milestone of milestones) {
      if (!grouped[milestone.subjectId]) {
        grouped[milestone.subjectId] = []
      }
      grouped[milestone.subjectId].push(milestone)
    }
    return grouped
  }, [milestones])

  const stats = useMemo(() => {
    const total = milestones.length
    const completed = milestones.filter((m) => m.status === 'completed').length
    const inProgress = milestones.filter((m) => m.status === 'in_progress').length
    const totalStars = milestones.reduce((sum, m) => sum + m.starValue, 0)
    const earnedStars = milestones
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + m.starValue, 0)
    return { total, completed, inProgress, totalStars, earnedStars }
  }, [milestones])

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
            description="Choose a student above to view their weekly plan"
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

          {/* Week Navigation */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => navigateWeek('prev')} style={{ padding: 8 }} accessibilityLabel="Previous week" accessibilityRole="button">
                <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={goToCurrentWeek}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigateWeek('next')} style={{ padding: 8 }} accessibilityLabel="Next week" accessibilityRole="button">
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Week Days Strip */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {weekDays.map((day) => {
                const isTodayDay = isToday(day)
                return (
                  <View
                    key={day.toISOString()}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isTodayDay ? studentColor : colors.surfaceSecondary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '500',
                        color: isTodayDay ? colors.textInverse : colors.textSecondary,
                        textTransform: 'uppercase',
                      }}
                    >
                      {format(day, 'EEE')}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isTodayDay ? colors.textInverse : colors.text,
                      }}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>
                )
              })}
            </View>
          </Card>

          {/* Stats */}
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: studentColor }}>{stats.total}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Milestones</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.success }}>{stats.completed}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Completed</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.warning }}>
                  {stats.earnedStars}/{stats.totalStars}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Stars</Text>
            </Card>
          </View>

          {/* Milestones List */}
          <View style={{ marginTop: 16 }}>
            {milestones.length === 0 ? (
              <Card>
                <EmptyState
                  icon="flag"
                  title="No Milestones"
                  description="Add milestones in the Milestones tab to see them here"
                />
              </Card>
            ) : (
              Object.entries(groupedMilestones).map(([subjectId, subjectMilestones]) => {
                const subject = getSubjectById(subjectId)
                return (
                  <Card key={subjectId} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                      {subject?.name || 'Unknown Subject'}
                    </Text>

                    <View style={{ gap: 8 }}>
                      {subjectMilestones.map((milestone) => {
                        const isCompleted = milestone.status === 'completed'
                        return (
                          <TouchableOpacity
                            key={milestone.id}
                            onPress={() => handleToggleComplete(milestone)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isCompleted }}
                            accessibilityLabel={`${milestone.title}, ${isCompleted ? 'completed' : 'not completed'}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              padding: 12,
                              borderRadius: 8,
                              backgroundColor: isCompleted ? colors.successLight : colors.background,
                              borderLeftWidth: 3,
                              borderLeftColor: isCompleted ? colors.success : colors.border,
                            }}
                          >
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                borderWidth: 2,
                                borderColor: isCompleted ? colors.success : colors.border,
                                backgroundColor: isCompleted ? colors.success : 'transparent',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10,
                              }}
                            >
                              {isCompleted && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '500',
                                  color: isCompleted ? colors.textSecondary : colors.text,
                                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                                }}
                              >
                                {milestone.title}
                              </Text>
                              {milestone.description && (
                                <Text
                                  style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}
                                  numberOfLines={1}
                                >
                                  {milestone.description}
                                </Text>
                              )}
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                  <Ionicons name="star" size={12} color={colors.warning} />
                                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{milestone.starValue}</Text>
                                </View>
                                <Badge
                                  variant={
                                    milestone.status === 'completed'
                                      ? 'success'
                                      : milestone.status === 'in_progress'
                                      ? 'warning'
                                      : 'default'
                                  }
                                >
                                  {milestone.status.replace('_', ' ')}
                                </Badge>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </Card>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
