import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, startOfWeek } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getMilestones, updateMilestone, createReward, getStudentStarTotals } from '../../src/database'
import type { Milestone, UpdateMilestone } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, Button, EmptyState, FAB, Modal, Input, ProgressBar } from '../../src/components/ui'

const statusOrder = ['in_progress', 'not_started', 'completed'] as const

export default function MilestonesScreen() {
  const { selectedStudentId, getSelectedStudent, getSubjectById, subjects } = useStore()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [starTotals, setStarTotals] = useState({ weeklyTotal: 0, allTimeTotal: 0 })
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all')

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

  const loadMilestones = useCallback(async () => {
    if (!selectedStudentId) return

    try {
      const [data, stars] = await Promise.all([
        getMilestones(selectedStudentId),
        getStudentStarTotals(selectedStudentId),
      ])

      // Sort by status order, then by category
      const sorted = data.sort((a, b) => {
        const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        if (statusDiff !== 0) return statusDiff
        return a.category.localeCompare(b.category)
      })

      setMilestones(sorted)
      setStarTotals(stars)
    } catch (err) {
      console.error('Failed to load milestones:', err)
    }
  }, [selectedStudentId])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadMilestones()
    setRefreshing(false)
  }, [loadMilestones])

  const handleUpdateStatus = async (milestone: Milestone, newStatus: Milestone['status']) => {
    try {
      const updates: UpdateMilestone = { status: newStatus }

      if (newStatus === 'completed') {
        updates.completedDate = format(new Date(), 'yyyy-MM-dd')

        // Award stars
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        await createReward({
          studentId: milestone.studentId,
          milestoneId: milestone.id,
          starsAwarded: milestone.starValue,
          awardedDate: format(new Date(), 'yyyy-MM-dd'),
          weekStart,
          syncedToSkylight: false,
        })

        Alert.alert('Congratulations!', `${milestone.starValue} star${milestone.starValue > 1 ? 's' : ''} earned!`)
      }

      await updateMilestone(milestone.id, updates)
      await loadMilestones()
      setModalVisible(false)
      setSelectedMilestone(null)
    } catch (err) {
      console.error('Failed to update milestone:', err)
      Alert.alert('Error', 'Failed to update milestone')
    }
  }

  const filteredMilestones = milestones.filter((m) => filter === 'all' || m.status === filter)

  const completedCount = milestones.filter((m) => m.status === 'completed').length
  const totalCount = milestones.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (!selectedStudentId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <EmptyState
          icon="person"
          title="Select a Student"
          description="Choose a student to view their milestones"
        />
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

          {/* Progress Overview */}
          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>Progress</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                {completedCount} / {totalCount} completed
              </Text>
            </View>
            <ProgressBar progress={progress} color={studentColor} showLabel />
          </Card>

          {/* Star Totals */}
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: studentColor }}>
                    {starTotals.weeklyTotal}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>This Week</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: studentColor }}>
                    {starTotals.allTimeTotal}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>All Time</Text>
              </View>
            </View>
          </Card>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'not_started', label: 'Not Started' },
                { key: 'completed', label: 'Completed' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setFilter(item.key as typeof filter)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: filter === item.key ? studentColor : '#f3f4f6',
                  }}
                >
                  <Text style={{ color: filter === item.key ? '#fff' : '#6b7280', fontWeight: '500' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Milestones List */}
          <View style={{ marginTop: 16 }}>
            {filteredMilestones.length === 0 ? (
              <EmptyState
                icon="flag"
                title="No Milestones"
                description={filter === 'all' ? 'No milestones set up yet' : `No ${filter.replace('_', ' ')} milestones`}
              />
            ) : (
              filteredMilestones.map((milestone) => {
                const subject = getSubjectById(milestone.subjectId)
                const statusColors = {
                  not_started: { variant: 'default' as const },
                  in_progress: { variant: 'warning' as const },
                  completed: { variant: 'success' as const },
                }

                return (
                  <TouchableOpacity
                    key={milestone.id}
                    onPress={() => {
                      setSelectedMilestone(milestone)
                      setModalVisible(true)
                    }}
                    activeOpacity={0.7}
                  >
                    <Card style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{milestone.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
                            {subject && <Badge variant="primary">{subject.name}</Badge>}
                            {milestone.category && <Badge variant="secondary">{milestone.category}</Badge>}
                            <Badge variant={statusColors[milestone.status].variant}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Ionicons name="star" size={14} color="#fbbf24" />
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>{milestone.starValue}</Text>
                        </View>
                      </View>
                      {milestone.description && (
                        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }} numberOfLines={2}>
                          {milestone.description}
                        </Text>
                      )}
                    </Card>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <Modal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false)
            setSelectedMilestone(null)
          }}
          title="Milestone Details"
          footer={
            selectedMilestone.status !== 'completed' && (
              <View style={{ gap: 8 }}>
                {selectedMilestone.status === 'not_started' && (
                  <Button
                    onPress={() => handleUpdateStatus(selectedMilestone, 'in_progress')}
                    color={studentColor}
                    fullWidth
                  >
                    Start Working On This
                  </Button>
                )}
                {selectedMilestone.status === 'in_progress' && (
                  <Button
                    onPress={() => handleUpdateStatus(selectedMilestone, 'completed')}
                    color="#10b981"
                    fullWidth
                  >
                    Mark as Complete
                  </Button>
                )}
              </View>
            )
          }
        >
          <View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
              {selectedMilestone.title}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {getSubjectById(selectedMilestone.subjectId) && (
                <Badge variant="primary">{getSubjectById(selectedMilestone.subjectId)!.name}</Badge>
              )}
              {selectedMilestone.category && <Badge variant="secondary">{selectedMilestone.category}</Badge>}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Ionicons name="star" size={12} color="#d97706" />
                <Text style={{ fontSize: 12, color: '#d97706', fontWeight: '500' }}>
                  {selectedMilestone.starValue} stars
                </Text>
              </View>
            </View>

            {selectedMilestone.description && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Description</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{selectedMilestone.description}</Text>
              </View>
            )}

            {selectedMilestone.evidenceNotes && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Evidence Notes</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{selectedMilestone.evidenceNotes}</Text>
              </View>
            )}

            {selectedMilestone.targetDate && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Target Date</Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>{selectedMilestone.targetDate}</Text>
              </View>
            )}

            {selectedMilestone.completedDate && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Completed</Text>
                <Text style={{ fontSize: 14, color: '#10b981' }}>{selectedMilestone.completedDate}</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  )
}
