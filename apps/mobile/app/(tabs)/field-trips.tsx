import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getFieldTrips, createFieldTrip, updateFieldTrip, deleteFieldTrip } from '../../src/database'
import type { FieldTrip, CreateFieldTrip, UniversalStatus, EventCategory } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, Button, EmptyState, FAB, Modal, Input, TextArea, DatePicker, TimePicker } from '../../src/components/ui'
import { useColors } from '../../src/theme/createStyles'

const eventCategoryOptions: { value: EventCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'educational', label: 'Educational', icon: 'school' },
  { value: 'social', label: 'Social', icon: 'people' },
  { value: 'coop', label: 'Co-op', icon: 'library' },
]

const statusOptions: { value: UniversalStatus; label: string }[] = [
  { value: 'not_started', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusLabels: Record<UniversalStatus, string> = {
  not_started: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function FieldTripsScreen() {
  const { selectedStudentId, getSelectedStudent, students, subjects } = useStore()
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null)
  const [filter, setFilter] = useState<'all' | UniversalStatus>('all')
  const [newTrip, setNewTrip] = useState<Partial<CreateFieldTrip>>({
    eventCategory: 'educational',
    status: 'not_started',
    date: format(new Date(), 'yyyy-MM-dd'),
    studentIds: [],
    subjectIds: [],
  })

  const colors = useColors()

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  const loadFieldTrips = useCallback(async () => {
    try {
      const data = await getFieldTrips(
        filter !== 'all' ? { status: filter } : undefined
      )
      // Filter by selected student if one is selected
      const filtered = selectedStudentId
        ? data.filter((trip) => trip.studentIds.includes(selectedStudentId))
        : data
      setFieldTrips(filtered)
    } catch (err) {
      console.error('Failed to load field trips:', err)
    }
  }, [selectedStudentId, filter])

  useEffect(() => {
    loadFieldTrips()
  }, [loadFieldTrips])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadFieldTrips()
    setRefreshing(false)
  }, [loadFieldTrips])

  const handleCreateTrip = async () => {
    if (!newTrip.title || !newTrip.location || !newTrip.date) {
      Alert.alert('Error', 'Please fill in title, location, and date')
      return
    }

    try {
      await createFieldTrip({
        title: newTrip.title,
        eventCategory: newTrip.eventCategory || 'educational',
        location: newTrip.location,
        description: newTrip.description,
        date: newTrip.date,
        startTime: newTrip.startTime,
        endTime: newTrip.endTime,
        status: newTrip.status || 'not_started',
        studentIds: newTrip.studentIds?.length ? newTrip.studentIds : students.map((s) => s.id),
        subjectIds: newTrip.subjectIds || [],
        cost: newTrip.cost,
        websiteUrl: newTrip.websiteUrl,
        notes: newTrip.notes,
        learningOutcomes: newTrip.learningOutcomes,
      })

      setModalVisible(false)
      setNewTrip({
        eventCategory: 'educational',
        status: 'not_started',
        date: format(new Date(), 'yyyy-MM-dd'),
        studentIds: [],
        subjectIds: [],
      })
      await loadFieldTrips()
    } catch (err) {
      console.error('Failed to create field trip:', err)
      Alert.alert('Error', 'Failed to create event')
    }
  }

  const handleUpdateStatus = async (trip: FieldTrip, newStatus: UniversalStatus) => {
    try {
      await updateFieldTrip(trip.id, { status: newStatus })
      await loadFieldTrips()
      setDetailModalVisible(false)
      setSelectedTrip(null)
    } catch (err) {
      console.error('Failed to update trip:', err)
      Alert.alert('Error', 'Failed to update event')
    }
  }

  const handleDeleteTrip = async (id: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFieldTrip(id)
            await loadFieldTrips()
            setDetailModalVisible(false)
            setSelectedTrip(null)
          } catch (err) {
            console.error('Failed to delete trip:', err)
          }
        },
      },
    ])
  }

  const getStatusBadgeVariant = (status: UniversalStatus) => {
    switch (status) {
      case 'not_started':
        return 'info' as const
      case 'in_progress':
        return 'warning' as const
      case 'completed':
        return 'success' as const
      case 'cancelled':
        return 'danger' as const
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'not_started', label: 'Planned' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setFilter(item.key as typeof filter)}
                  accessibilityLabel={`Filter: ${item.label}${filter === item.key ? ', selected' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: filter === item.key }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: filter === item.key ? studentColor : colors.surfaceSecondary,
                  }}
                >
                  <Text style={{ color: filter === item.key ? colors.textInverse : colors.textSecondary, fontWeight: '500' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Field Trips List */}
          <View style={{ marginTop: 16 }}>
            {fieldTrips.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No Events"
                description="Tap + to plan a new event"
                action={
                  <Button onPress={() => setModalVisible(true)} color={studentColor}>
                    Create Event
                  </Button>
                }
              />
            ) : (
              fieldTrips.map((trip) => {
                const categoryOption = eventCategoryOptions.find((t) => t.value === trip.eventCategory)

                return (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => {
                      setSelectedTrip(trip)
                      setDetailModalVisible(true)
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={`${trip.title} at ${trip.location}, ${statusLabels[trip.status]}`}
                    accessibilityRole="button"
                  >
                    <Card style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.primaryLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name={categoryOption?.icon || 'calendar'} size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{trip.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <Ionicons name="location" size={14} color={colors.textSecondary} />
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{trip.location}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                              {format(parseISO(trip.date), 'EEE, MMM d, yyyy')}
                              {trip.startTime && ` at ${trip.startTime}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Badge variant="primary">{categoryOption?.label || 'Event'}</Badge>
                          <Badge variant={getStatusBadgeVariant(trip.status)}>{statusLabels[trip.status]}</Badge>
                        </View>
                        {trip.cost && <Text style={{ fontSize: 12, color: colors.textSecondary }}>${trip.cost.toFixed(2)}</Text>}
                      </View>
                    </Card>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>

      <FAB onPress={() => setModalVisible(true)} color={studentColor} />

      {/* Create Event Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="New Event"
        footer={
          <Button onPress={handleCreateTrip} color={studentColor} fullWidth>
            Create Event
          </Button>
        }
      >
        <Input
          label="Title *"
          value={newTrip.title || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, title: text })}
          placeholder="Museum Visit"
        />

        <Input
          label="Location *"
          value={newTrip.location || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, location: text })}
          placeholder="Natural History Museum"
        />

        <DatePicker
          label="Date *"
          value={newTrip.date || ''}
          onChange={(date) => setNewTrip({ ...newTrip, date })}
        />

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <TimePicker
              label="Start Time"
              value={newTrip.startTime || ''}
              onChange={(time) => setNewTrip({ ...newTrip, startTime: time })}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TimePicker
              label="End Time"
              value={newTrip.endTime || ''}
              onChange={(time) => setNewTrip({ ...newTrip, endTime: time })}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>Event Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {eventCategoryOptions.map((category) => (
              <TouchableOpacity
                key={category.value}
                onPress={() => setNewTrip({ ...newTrip, eventCategory: category.value })}
                accessibilityLabel={`${category.label}${newTrip.eventCategory === category.value ? ', selected' : ''}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: newTrip.eventCategory === category.value }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: newTrip.eventCategory === category.value ? studentColor : colors.surfaceSecondary,
                }}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={newTrip.eventCategory === category.value ? colors.textInverse : colors.textSecondary}
                />
                <Text style={{ color: newTrip.eventCategory === category.value ? colors.textInverse : colors.textSecondary }}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Input
          label="Cost"
          value={newTrip.cost?.toString() || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, cost: parseFloat(text) || undefined })}
          placeholder="25.00"
          keyboardType="decimal-pad"
        />

        <Input
          label="Website URL"
          value={newTrip.websiteUrl || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, websiteUrl: text })}
          placeholder="https://museum.org"
          keyboardType="url"
          autoCapitalize="none"
        />

        <TextArea
          label="Notes"
          value={newTrip.notes || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, notes: text })}
          placeholder="Parking available, bring snacks..."
        />

        <TextArea
          label="Learning Outcomes"
          value={newTrip.learningOutcomes || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, learningOutcomes: text })}
          placeholder="What we hope to learn..."
        />
      </Modal>

      {/* Event Detail Modal */}
      {selectedTrip && (
        <Modal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false)
            setSelectedTrip(null)
          }}
          title="Event Details"
          footer={
            <View style={{ gap: 8 }}>
              {selectedTrip.status === 'not_started' && (
                <Button
                  onPress={() => handleUpdateStatus(selectedTrip, 'completed')}
                  color={colors.success}
                  fullWidth
                >
                  Mark as Completed
                </Button>
              )}
              <Button onPress={() => handleDeleteTrip(selectedTrip.id)} variant="danger" fullWidth>
                Delete Event
              </Button>
            </View>
          }
        >
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            {selectedTrip.title}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <Badge variant="primary">
              {eventCategoryOptions.find((t) => t.value === selectedTrip.eventCategory)?.label || 'Event'}
            </Badge>
            <Badge variant={getStatusBadgeVariant(selectedTrip.status)}>{statusLabels[selectedTrip.status]}</Badge>
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location" size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.text }}>{selectedTrip.location}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar" size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.text }}>
                {format(parseISO(selectedTrip.date), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>

            {(selectedTrip.startTime || selectedTrip.endTime) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {selectedTrip.startTime || 'TBD'} - {selectedTrip.endTime || 'TBD'}
                </Text>
              </View>
            )}

            {selectedTrip.cost && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cash" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text }}>${selectedTrip.cost.toFixed(2)}</Text>
              </View>
            )}

            {selectedTrip.websiteUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(selectedTrip.websiteUrl!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                accessibilityLabel="Visit website"
                accessibilityRole="link"
              >
                <Ionicons name="link" size={18} color={colors.studentBlue} />
                <Text style={{ fontSize: 14, color: colors.studentBlue }}>Visit Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedTrip.description && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 }}>Description</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{selectedTrip.description}</Text>
            </View>
          )}

          {selectedTrip.learningOutcomes && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 }}>
                Learning Outcomes
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{selectedTrip.learningOutcomes}</Text>
            </View>
          )}

          {selectedTrip.notes && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{selectedTrip.notes}</Text>
            </View>
          )}
        </Modal>
      )}
    </View>
  )
}
