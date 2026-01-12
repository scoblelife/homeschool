/**
 * RecurringActivities Component - Scheduled activity suggestions
 *
 * Features:
 * - Shows activities due today based on recurrence patterns
 * - One-tap to confirm/skip logging
 * - Auto-suggest at scheduled times
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { format } from 'date-fns'
import { useStore } from '../../stores/useStore'
import type {
  RecurringActivity,
  CreateRecurringActivity,
  RecurrencePattern,
  ActivityType
} from '../../../../shared/types'

interface RecurringActivitiesProps {
  onActivityCreated?: () => void
}

const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'worksheet', label: 'Worksheet', icon: '📝' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'writing_print', label: 'Print', icon: '✏️' },
  { value: 'writing_cursive', label: 'Cursive', icon: '✍️' },
  { value: 'hands_on', label: 'Hands-on', icon: '🎨' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'assessment', label: 'Test', icon: '📋' },
]

const recurrenceOptions: { value: RecurrencePattern; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom days' },
]

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RecurringActivities({ onActivityCreated }: RecurringActivitiesProps): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const [dueActivities, setDueActivities] = useState<RecurringActivity[]>([])
  const [allRecurring, setAllRecurring] = useState<RecurringActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Create form state
  const [formData, setFormData] = useState<Omit<CreateRecurringActivity, 'isActive'>>({
    studentId: '',
    subjectId: '',
    title: '',
    activityType: 'worksheet',
    durationMinutes: 30,
    recurrencePattern: 'weekdays',
    recurrenceDays: null,
    startTime: '09:00'
  })

  // Load due activities
  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    try {
      const [due, all] = await Promise.all([
        window.api.getDueRecurringActivities(selectedStudentId || undefined),
        window.api.getRecurringActivities(selectedStudentId || undefined)
      ])
      setDueActivities(due)
      setAllRecurring(all)
    } catch (err) {
      console.error('Failed to load recurring activities:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudentId])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Initialize form with selected student
  useEffect(() => {
    if (selectedStudentId) {
      setFormData(prev => ({ ...prev, studentId: selectedStudentId }))
    } else if (students.length === 1) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }))
    }
  }, [selectedStudentId, students])

  // Log a recurring activity
  const handleLogActivity = async (activity: RecurringActivity): Promise<void> => {
    setIsProcessing(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Create the activity
      await window.api.createActivity({
        studentId: activity.studentId,
        subjectId: activity.subjectId,
        sessionId: null,
        activityType: activity.activityType,
        title: activity.title,
        description: '',
        dateCompleted: today,
        durationMinutes: activity.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: 'Logged from recurring activity'
      })

      // Mark as logged
      await window.api.markRecurringActivityLogged(activity.id, today)

      // Refresh the list
      await loadActivities()
      onActivityCreated?.()
    } catch (err) {
      console.error('Failed to log recurring activity:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Skip an activity (just mark as logged without creating)
  const handleSkipActivity = async (activity: RecurringActivity): Promise<void> => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      await window.api.markRecurringActivityLogged(activity.id, today)
      await loadActivities()
    } catch (err) {
      console.error('Failed to skip activity:', err)
    }
  }

  // Create a new recurring activity
  const handleCreateRecurring = async (): Promise<void> => {
    if (!formData.studentId || !formData.subjectId || !formData.title.trim()) {
      return
    }

    setIsProcessing(true)
    try {
      await window.api.createRecurringActivity({
        ...formData,
        isActive: true
      })

      setShowCreateModal(false)
      resetForm()
      await loadActivities()
    } catch (err) {
      console.error('Failed to create recurring activity:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete a recurring activity
  const handleDeleteRecurring = async (id: string): Promise<void> => {
    if (!confirm('Delete this recurring activity?')) return

    try {
      await window.api.deleteRecurringActivity(id)
      await loadActivities()
    } catch (err) {
      console.error('Failed to delete recurring activity:', err)
    }
  }

  const resetForm = (): void => {
    setFormData({
      studentId: selectedStudentId || (students.length === 1 ? students[0].id : ''),
      subjectId: '',
      title: '',
      activityType: 'worksheet',
      durationMinutes: 30,
      recurrencePattern: 'weekdays',
      recurrenceDays: null,
      startTime: '09:00'
    })
  }

  const getTypeInfo = (type: ActivityType) => activityTypes.find(t => t.value === type)

  // Don't render if no due activities and not expanded
  if (isLoading) {
    return (
      <div className="card mb-6">
        <div className="text-gray-500">Loading scheduled activities...</div>
      </div>
    )
  }

  if (dueActivities.length === 0 && allRecurring.length === 0) {
    return (
      <div className="card mb-6 bg-gradient-to-r from-blue-50 to-fuchsia-50 border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="font-semibold text-gray-900">Recurring Activities</h2>
              <p className="text-sm text-gray-500">Set up daily or weekly activities</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create Schedule
          </button>
        </div>

        {/* Create Modal */}
        <CreateRecurringModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            resetForm()
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateRecurring}
          isProcessing={isProcessing}
          students={students}
          subjects={subjects}
        />
      </div>
    )
  }

  return (
    <>
      {/* Due Today Section */}
      {dueActivities.length > 0 && (
        <div className="card mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
                <p className="text-sm text-gray-500">{dueActivities.length} activit{dueActivities.length === 1 ? 'y' : 'ies'} scheduled</p>
              </div>
            </div>
            <button
              onClick={() => setShowManageModal(true)}
              className="text-sm text-amber-700 hover:text-amber-900"
            >
              Manage Schedules
            </button>
          </div>

          <div className="space-y-3">
            {dueActivities.map((activity) => {
              const student = getStudentById(activity.studentId)
              const subject = getSubjectById(activity.subjectId)
              const typeInfo = getTypeInfo(activity.activityType)

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200"
                >
                  <span className="text-2xl">{typeInfo?.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-500">
                      {subject?.name} • {student?.name}
                      {activity.durationMinutes && ` • ${activity.durationMinutes} min`}
                      {activity.startTime && ` • ${activity.startTime}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSkipActivity(activity)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleLogActivity(activity)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Done!
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Manage Modal */}
      <ManageRecurringModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        activities={allRecurring}
        onDelete={handleDeleteRecurring}
        onCreate={() => {
          setShowManageModal(false)
          setShowCreateModal(true)
        }}
        getStudentById={getStudentById}
        getSubjectById={getSubjectById}
        getTypeInfo={getTypeInfo}
      />

      {/* Create Modal */}
      <CreateRecurringModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateRecurring}
        isProcessing={isProcessing}
        students={students}
        subjects={subjects}
      />
    </>
  )
}

// Manage Recurring Activities Modal
function ManageRecurringModal({
  isOpen,
  onClose,
  activities,
  onDelete,
  onCreate,
  getStudentById,
  getSubjectById,
  getTypeInfo
}: {
  isOpen: boolean
  onClose: () => void
  activities: RecurringActivity[]
  onDelete: (id: string) => Promise<void>
  onCreate: () => void
  getStudentById: (id: string) => { name: string } | undefined
  getSubjectById: (id: string) => { name: string } | undefined
  getTypeInfo: (type: ActivityType) => { icon: string; label: string } | undefined
}): JSX.Element {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="bg-blue-600 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Manage Recurring Activities
                  </Dialog.Title>
                </div>

                <div className="p-6">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recurring activities set up yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activities.map((activity) => {
                        const student = getStudentById(activity.studentId)
                        const subject = getSubjectById(activity.subjectId)
                        const typeInfo = getTypeInfo(activity.activityType)
                        const patternLabel = recurrenceOptions.find(r => r.value === activity.recurrencePattern)?.label

                        return (
                          <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-xl">{typeInfo?.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{activity.title}</div>
                              <div className="text-sm text-gray-500">
                                {subject?.name} • {student?.name}
                              </div>
                              <div className="text-xs text-blue-600">
                                {patternLabel}
                                {activity.startTime && ` at ${activity.startTime}`}
                              </div>
                            </div>
                            <button
                              onClick={() => onDelete(activity.id)}
                              className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={onCreate}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      + Add New
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Create Recurring Activity Modal
function CreateRecurringModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isProcessing,
  students,
  subjects
}: {
  isOpen: boolean
  onClose: () => void
  formData: Omit<CreateRecurringActivity, 'isActive'>
  setFormData: (data: Omit<CreateRecurringActivity, 'isActive'>) => void
  onSubmit: () => Promise<void>
  isProcessing: boolean
  students: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
}): JSX.Element {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="bg-blue-600 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Create Recurring Activity
                  </Dialog.Title>
                  <p className="text-blue-200 text-sm mt-1">
                    Set up an activity that repeats automatically
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Activity Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {activityTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, activityType: type.value })}
                          className={`p-2 rounded-lg text-center transition-colors ${
                            formData.activityType === type.value
                              ? 'bg-blue-100 ring-2 ring-blue-500'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-xl">{type.icon}</div>
                          <div className="text-xs mt-1">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                    <div className="flex flex-wrap gap-2">
                      {students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, studentId: student.id })}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.studentId === student.id
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {student.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, subjectId: subject.id })}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.subjectId === subject.id
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {subject.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity Name</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Daily reading practice"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Recurrence Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
                    <select
                      value={formData.recurrencePattern}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrencePattern: e.target.value as RecurrencePattern,
                        recurrenceDays: e.target.value === 'custom' ? [1, 3, 5] : null
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {recurrenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Days */}
                  {formData.recurrencePattern === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = formData.recurrenceDays || []
                              const newDays = currentDays.includes(index)
                                ? currentDays.filter(d => d !== index)
                                : [...currentDays, index]
                              setFormData({ ...formData, recurrenceDays: newDays })
                            }}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                              (formData.recurrenceDays || []).includes(index)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
                      <input
                        type="time"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        value={formData.durationMinutes || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          durationMinutes: e.target.value ? parseInt(e.target.value) : null
                        })}
                        placeholder="30"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSubmit}
                      disabled={isProcessing || !formData.studentId || !formData.subjectId || !formData.title.trim()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Creating...' : 'Create Schedule'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
