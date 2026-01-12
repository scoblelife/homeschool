import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getFieldTrips, createFieldTrip, updateFieldTrip, deleteFieldTrip } from '../../src/database'
import type { FieldTrip, CreateFieldTrip, FieldTripStatus, EventActivityType } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, Button, EmptyState, FAB, Modal, Input, TextArea, Chip, ChipGroup } from '../../src/components/ui'

const activityTypeOptions: { value: EventActivityType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'field_trip', label: 'Field Trip', icon: 'bus' },
  { value: 'park_day', label: 'Park Day', icon: 'leaf' },
  { value: 'game_night', label: 'Game Night', icon: 'game-controller' },
  { value: 'playdate', label: 'Playdate', icon: 'people' },
  { value: 'coop_class', label: 'Co-op Class', icon: 'school' },
  { value: 'custom', label: 'Custom', icon: 'calendar' },
]

const statusOptions: { value: FieldTripStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function FieldTripsScreen() {
  const { selectedStudentId, getSelectedStudent, students, subjects } = useStore()
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null)
  const [filter, setFilter] = useState<'all' | FieldTripStatus>('all')
  const [newTrip, setNewTrip] = useState<Partial<CreateFieldTrip>>({
    activityType: 'field_trip',
    status: 'planned',
    date: format(new Date(), 'yyyy-MM-dd'),
    studentIds: [],
    subjectIds: [],
  })

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

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
        activityType: newTrip.activityType || 'field_trip',
        location: newTrip.location,
        description: newTrip.description,
        date: newTrip.date,
        startTime: newTrip.startTime,
        endTime: newTrip.endTime,
        status: newTrip.status || 'planned',
        studentIds: newTrip.studentIds?.length ? newTrip.studentIds : students.map((s) => s.id),
        subjectIds: newTrip.subjectIds || [],
        cost: newTrip.cost,
        websiteUrl: newTrip.websiteUrl,
        notes: newTrip.notes,
        learningOutcomes: newTrip.learningOutcomes,
      })

      setModalVisible(false)
      setNewTrip({
        activityType: 'field_trip',
        status: 'planned',
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

  const handleUpdateStatus = async (trip: FieldTrip, newStatus: FieldTripStatus) => {
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

  const getStatusBadgeVariant = (status: FieldTripStatus) => {
    switch (status) {
      case 'planned':
        return 'info' as const
      case 'completed':
        return 'success' as const
      case 'cancelled':
        return 'danger' as const
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
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
                { key: 'planned', label: 'Planned' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
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
                const typeOption = activityTypeOptions.find((t) => t.value === trip.activityType)

                return (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => {
                      setSelectedTrip(trip)
                      setDetailModalVisible(true)
                    }}
                    activeOpacity={0.7}
                  >
                    <Card style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#f3e8ff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name={typeOption?.icon || 'calendar'} size={20} color="#d946ef" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{trip.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <Ionicons name="location" size={14} color="#6b7280" />
                            <Text style={{ fontSize: 13, color: '#6b7280' }}>{trip.location}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <Ionicons name="calendar" size={14} color="#6b7280" />
                            <Text style={{ fontSize: 13, color: '#6b7280' }}>
                              {format(parseISO(trip.date), 'EEE, MMM d, yyyy')}
                              {trip.startTime && ` at ${trip.startTime}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Badge variant="primary">{typeOption?.label || 'Event'}</Badge>
                          <Badge variant={getStatusBadgeVariant(trip.status)}>{trip.status}</Badge>
                        </View>
                        {trip.cost && <Text style={{ fontSize: 12, color: '#6b7280' }}>${trip.cost.toFixed(2)}</Text>}
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

        <Input
          label="Date *"
          value={newTrip.date || ''}
          onChangeText={(text) => setNewTrip({ ...newTrip, date: text })}
          placeholder="2024-03-15"
        />

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Start Time"
              value={newTrip.startTime || ''}
              onChangeText={(text) => setNewTrip({ ...newTrip, startTime: text })}
              placeholder="10:00"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="End Time"
              value={newTrip.endTime || ''}
              onChangeText={(text) => setNewTrip({ ...newTrip, endTime: text })}
              placeholder="14:00"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Event Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {activityTypeOptions.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setNewTrip({ ...newTrip, activityType: type.value })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: newTrip.activityType === type.value ? studentColor : '#f3f4f6',
                }}
              >
                <Ionicons
                  name={type.icon}
                  size={16}
                  color={newTrip.activityType === type.value ? '#fff' : '#6b7280'}
                />
                <Text style={{ color: newTrip.activityType === type.value ? '#fff' : '#6b7280' }}>
                  {type.label}
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
              {selectedTrip.status === 'planned' && (
                <Button
                  onPress={() => handleUpdateStatus(selectedTrip, 'completed')}
                  color="#10b981"
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
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
            {selectedTrip.title}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <Badge variant="primary">
              {activityTypeOptions.find((t) => t.value === selectedTrip.activityType)?.label || 'Event'}
            </Badge>
            <Badge variant={getStatusBadgeVariant(selectedTrip.status)}>{selectedTrip.status}</Badge>
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, color: '#374151' }}>{selectedTrip.location}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, color: '#374151' }}>
                {format(parseISO(selectedTrip.date), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>

            {(selectedTrip.startTime || selectedTrip.endTime) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time" size={18} color="#6b7280" />
                <Text style={{ fontSize: 14, color: '#374151' }}>
                  {selectedTrip.startTime || 'TBD'} - {selectedTrip.endTime || 'TBD'}
                </Text>
              </View>
            )}

            {selectedTrip.cost && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cash" size={18} color="#6b7280" />
                <Text style={{ fontSize: 14, color: '#374151' }}>${selectedTrip.cost.toFixed(2)}</Text>
              </View>
            )}

            {selectedTrip.websiteUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(selectedTrip.websiteUrl!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Ionicons name="link" size={18} color="#2563eb" />
                <Text style={{ fontSize: 14, color: '#2563eb' }}>Visit Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedTrip.description && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Description</Text>
              <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{selectedTrip.description}</Text>
            </View>
          )}

          {selectedTrip.learningOutcomes && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                Learning Outcomes
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{selectedTrip.learningOutcomes}</Text>
            </View>
          )}

          {selectedTrip.notes && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{selectedTrip.notes}</Text>
            </View>
          )}
        </Modal>
      )}
    </View>
  )
}
