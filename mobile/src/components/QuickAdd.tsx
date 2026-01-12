/**
 * QuickAdd Component - Mobile rapid activity logging
 *
 * Features:
 * - Floating action button on dashboard
 * - Single-tap to log common activities
 * - Recent activities as quick buttons
 * - Complete logging in <10 seconds
 */

import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native'
import { format } from 'date-fns'
import { useStore } from '../stores/useStore'
import { createActivity, getActivities } from '../database'
import type { ActivityType, CreateActivity, Activity } from '../types'

interface QuickAddProps {
  onActivityCreated?: () => void
}

interface RecentActivityTemplate {
  title: string
  subjectId: string
  activityType: ActivityType
  studentId: string
  count: number
}

const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'worksheet', label: 'Worksheet', icon: '' },
  { value: 'video', label: 'Video', icon: '' },
  { value: 'reading', label: 'Reading', icon: '' },
  { value: 'writing_print', label: 'Print', icon: '' },
  { value: 'writing_cursive', label: 'Cursive', icon: '' },
  { value: 'hands_on', label: 'Hands-on', icon: '' },
  { value: 'game', label: 'Game', icon: '' },
  { value: 'assessment', label: 'Test', icon: '' },
]

const durationOptions = [15, 30, 45, 60, 90]

export function QuickAdd({ onActivityCreated }: QuickAddProps) {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'recent' | 'type' | 'details'>('recent')
  const [recentTemplates, setRecentTemplates] = useState<RecentActivityTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [selectedType, setSelectedType] = useState<ActivityType>('worksheet')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number | null>(30)

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0]

  // Load recent activity patterns
  const loadRecentTemplates = useCallback(async () => {
    try {
      const activities = await getActivities({
        studentId: selectedStudentId || undefined,
      })

      // Group by unique combinations and count
      const templateMap = new Map<string, RecentActivityTemplate>()

      activities.slice(0, 50).forEach((activity: Activity) => {
        const key = `${activity.title}|${activity.subjectId}|${activity.activityType}|${activity.studentId}`
        const existing = templateMap.get(key)
        if (existing) {
          existing.count++
        } else {
          templateMap.set(key, {
            title: activity.title,
            subjectId: activity.subjectId,
            activityType: activity.activityType,
            studentId: activity.studentId,
            count: 1,
          })
        }
      })

      // Sort by count and take top 6
      const templates = Array.from(templateMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      setRecentTemplates(templates)
    } catch (err) {
      console.error('Failed to load recent templates:', err)
    }
  }, [selectedStudentId])

  useEffect(() => {
    if (isOpen) {
      loadRecentTemplates()
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [isOpen, loadRecentTemplates])

  // Initialize selected student when modal opens
  useEffect(() => {
    if (isOpen && selectedStudentId) {
      setSelectedStudentIds([selectedStudentId])
    } else if (isOpen && students.length === 1) {
      setSelectedStudentIds([students[0].id])
    }
  }, [isOpen, selectedStudentId, students])

  const resetForm = () => {
    setStep('recent')
    setSelectedType('worksheet')
    setSelectedStudentIds(selectedStudentId ? [selectedStudentId] : [])
    setSelectedSubjectId('')
    setTitle('')
    setDuration(30)
  }

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false)
      resetForm()
    })
  }

  // Quick log from template - logs immediately
  const handleQuickLog = async (template: RecentActivityTemplate) => {
    setIsLoading(true)
    try {
      const activityData: CreateActivity = {
        studentId: template.studentId,
        subjectId: template.subjectId,
        sessionId: null,
        activityType: template.activityType,
        title: template.title,
        description: '',
        dateCompleted: format(new Date(), 'yyyy-MM-dd'),
        durationMinutes: 30,
        grade: null,
        maxGrade: null,
        notes: '',
      }

      await createActivity(activityData)
      onActivityCreated?.()
      handleClose()
    } catch (err) {
      console.error('Failed to log activity:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit new activity
  const handleSubmit = async () => {
    if (!selectedSubjectId || !title.trim() || selectedStudentIds.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      for (const studentId of selectedStudentIds) {
        const activityData: CreateActivity = {
          studentId,
          subjectId: selectedSubjectId,
          sessionId: null,
          activityType: selectedType,
          title: title.trim(),
          description: '',
          dateCompleted: format(new Date(), 'yyyy-MM-dd'),
          durationMinutes: duration,
          grade: null,
          maxGrade: null,
          notes: '',
        }

        await createActivity(activityData)
      }

      onActivityCreated?.()
      handleClose()
    } catch (err) {
      console.error('Failed to create activity:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeInfo = (type: ActivityType) => activityTypes.find((t) => t.value === type)

  const studentColor = selectedStudentId
    ? getStudentById(selectedStudentId)?.color === 'child2'
      ? '#14b8a6'
      : '#d946ef'
    : '#d946ef'

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          backgroundColor: studentColor,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 32, color: '#fff', fontWeight: '300', marginTop: -2 }}>+</Text>
      </TouchableOpacity>

      {/* Quick Add Modal */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={handleClose}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            }}
          >
            <Pressable
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: Dimensions.get('window').height * 0.85,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View style={{ backgroundColor: studentColor, paddingHorizontal: 20, paddingVertical: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>
                  {step === 'recent' && 'Quick Add Activity'}
                  {step === 'type' && 'Select Activity Type'}
                  {step === 'details' && 'Activity Details'}
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                  {step === 'recent' && 'Tap to log or create new'}
                  {step === 'type' && 'What kind of activity?'}
                  {step === 'details' && 'Almost done!'}
                </Text>
              </View>

              <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Step: Recent Activities */}
                {step === 'recent' && (
                  <View>
                    {recentTemplates.length > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#6b7280', marginBottom: 12 }}>
                          Recent Activities
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          {recentTemplates.map((template, index) => {
                            const student = getStudentById(template.studentId)
                            const subject = getSubjectById(template.subjectId)
                            const typeInfo = getTypeInfo(template.activityType)
                            return (
                              <TouchableOpacity
                                key={index}
                                onPress={() => handleQuickLog(template)}
                                disabled={isLoading}
                                activeOpacity={0.7}
                                style={{
                                  width: '48%',
                                  padding: 12,
                                  backgroundColor: '#f9fafb',
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: '#e5e7eb',
                                  opacity: isLoading ? 0.5 : 1,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                  <Text style={{ fontSize: 16, marginRight: 6 }}>{typeInfo?.icon}</Text>
                                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>{subject?.name}</Text>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }} numberOfLines={1}>
                                  {template.title}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{student?.name}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => setStep('type')}
                      activeOpacity={0.8}
                      style={{
                        paddingVertical: 14,
                        backgroundColor: studentColor,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>+ New Activity</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step: Activity Type Selection */}
                {step === 'type' && (
                  <View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {activityTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => {
                            setSelectedType(type.value)
                            setStep('details')
                          }}
                          activeOpacity={0.7}
                          style={{
                            width: '23%',
                            paddingVertical: 16,
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 24, marginBottom: 4 }}>{type.icon}</Text>
                          <Text style={{ fontSize: 11, color: '#374151', textAlign: 'center' }}>{type.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={() => setStep('recent')}
                      activeOpacity={0.7}
                      style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>Back</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step: Details */}
                {step === 'details' && (
                  <View>
                    {/* Selected Type Display */}
                    <TouchableOpacity
                      onPress={() => setStep('type')}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        backgroundColor: '#fdf4ff',
                        borderRadius: 12,
                        marginBottom: 16,
                      }}
                    >
                      <Text style={{ fontSize: 28, marginRight: 12 }}>{getTypeInfo(selectedType)?.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#d946ef' }}>
                          {getTypeInfo(selectedType)?.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#d946ef' }}>Tap to change</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Student Selection */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Student</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {students.map((student) => (
                          <TouchableOpacity
                            key={student.id}
                            onPress={() => {
                              if (selectedStudentIds.includes(student.id)) {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id))
                              } else {
                                setSelectedStudentIds([...selectedStudentIds, student.id])
                              }
                            }}
                            activeOpacity={0.7}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: selectedStudentIds.includes(student.id) ? '#fce7f3' : '#f3f4f6',
                              borderWidth: selectedStudentIds.includes(student.id) ? 2 : 0,
                              borderColor: '#d946ef',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: selectedStudentIds.includes(student.id) ? '#d946ef' : '#6b7280',
                              }}
                            >
                              {student.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Subject Selection */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Subject</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {subjects.map((subject) => (
                          <TouchableOpacity
                            key={subject.id}
                            onPress={() => setSelectedSubjectId(subject.id)}
                            activeOpacity={0.7}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: selectedSubjectId === subject.id ? '#fce7f3' : '#f3f4f6',
                              borderWidth: selectedSubjectId === subject.id ? 2 : 0,
                              borderColor: '#d946ef',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: selectedSubjectId === subject.id ? '#d946ef' : '#6b7280',
                              }}
                            >
                              {subject.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Title */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                        Activity Title
                      </Text>
                      <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Chapter 5 worksheet"
                        placeholderTextColor="#9ca3af"
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          backgroundColor: '#f9fafb',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          fontSize: 15,
                          color: '#1f2937',
                        }}
                      />
                    </View>

                    {/* Duration Quick Select */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                        Duration (optional)
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {durationOptions.map((mins) => (
                          <TouchableOpacity
                            key={mins}
                            onPress={() => setDuration(duration === mins ? null : mins)}
                            activeOpacity={0.7}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: duration === mins ? '#fce7f3' : '#f3f4f6',
                              borderWidth: duration === mins ? 2 : 0,
                              borderColor: '#d946ef',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: duration === mins ? '#d946ef' : '#6b7280',
                              }}
                            >
                              {mins} min
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => setStep('type')}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#d1d5db',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280' }}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isLoading || !selectedSubjectId || !title.trim() || selectedStudentIds.length === 0}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          backgroundColor:
                            isLoading || !selectedSubjectId || !title.trim() || selectedStudentIds.length === 0
                              ? '#9ca3af'
                              : studentColor,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                          {isLoading ? 'Saving...' : 'Log Activity'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}
