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

function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

export default function PlannerScreen() {
  const { selectedStudentId, getSelectedStudent, getSubjectById } = useStore()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => format(getCurrentWeekStart(), 'yyyy-MM-dd'))
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

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
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
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
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Week Navigation */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => navigateWeek('prev')} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={24} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity onPress={goToCurrentWeek}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigateWeek('next')} style={{ padding: 8 }}>
                <Ionicons name="chevron-forward" size={24} color="#6b7280" />
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
                      backgroundColor: isTodayDay ? studentColor : '#f3f4f6',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '500',
                        color: isTodayDay ? '#fff' : '#6b7280',
                        textTransform: 'uppercase',
                      }}
                    >
                      {format(day, 'EEE')}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isTodayDay ? '#fff' : '#1f2937',
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
              <Text style={{ fontSize: 11, color: '#6b7280' }}>Milestones</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#10b981' }}>{stats.completed}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>Completed</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#f59e0b' }}>
                  {stats.earnedStars}/{stats.totalStars}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>Stars</Text>
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
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                      {subject?.name || 'Unknown Subject'}
                    </Text>

                    <View style={{ gap: 8 }}>
                      {subjectMilestones.map((milestone) => {
                        const isCompleted = milestone.status === 'completed'
                        return (
                          <TouchableOpacity
                            key={milestone.id}
                            onPress={() => handleToggleComplete(milestone)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              padding: 12,
                              borderRadius: 8,
                              backgroundColor: isCompleted ? '#ecfdf5' : '#f9fafb',
                              borderLeftWidth: 3,
                              borderLeftColor: isCompleted ? '#10b981' : '#d1d5db',
                            }}
                          >
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                borderWidth: 2,
                                borderColor: isCompleted ? '#10b981' : '#d1d5db',
                                backgroundColor: isCompleted ? '#10b981' : 'transparent',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10,
                              }}
                            >
                              {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '500',
                                  color: isCompleted ? '#6b7280' : '#1f2937',
                                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                                }}
                              >
                                {milestone.title}
                              </Text>
                              {milestone.description && (
                                <Text
                                  style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}
                                  numberOfLines={1}
                                >
                                  {milestone.description}
                                </Text>
                              )}
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                  <Ionicons name="star" size={12} color="#fbbf24" />
                                  <Text style={{ fontSize: 11, color: '#6b7280' }}>{milestone.starValue}</Text>
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
