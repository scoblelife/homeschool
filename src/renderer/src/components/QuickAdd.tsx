/**
 * QuickAdd Component - Rapid activity logging
 *
 * Features:
 * - Floating action button on dashboard
 * - Single-tap to log common activities
 * - Recent activities as quick buttons
 * - Complete logging in <10 seconds
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { format } from 'date-fns'
import { useStore } from '../stores/useStore'
import { SubjectSuggestions } from '../features/aiInsights'
import type { ActivityType, CreateActivity, Activity } from '../../../shared/types'

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
  { value: 'worksheet', label: 'Worksheet', icon: '📝' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'writing_print', label: 'Print', icon: '✏️' },
  { value: 'writing_cursive', label: 'Cursive', icon: '✍️' },
  { value: 'hands_on', label: 'Hands-on', icon: '🎨' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'assessment', label: 'Test', icon: '📋' },
]

// Default duration options in minutes
const durationOptions = [15, 30, 45, 60, 90]

export default function QuickAdd({ onActivityCreated }: QuickAddProps): JSX.Element {
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

  // Load recent activity patterns
  const loadRecentTemplates = useCallback(async () => {
    try {
      const activities = await window.api.getActivities({
        studentId: selectedStudentId || undefined
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
            count: 1
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

  const resetForm = (): void => {
    setStep('recent')
    setSelectedType('worksheet')
    setSelectedStudentIds(selectedStudentId ? [selectedStudentId] : [])
    setSelectedSubjectId('')
    setTitle('')
    setDuration(30)
  }

  const handleClose = (): void => {
    setIsOpen(false)
    resetForm()
  }

  // Quick log from template - logs immediately
  const handleQuickLog = async (template: RecentActivityTemplate): Promise<void> => {
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
        notes: ''
      }

      await window.api.createActivity(activityData)
      onActivityCreated?.()
      handleClose()
    } catch (err) {
      console.error('Failed to log activity:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit new activity
  const handleSubmit = async (): Promise<void> => {
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
          notes: ''
        }

        await window.api.createActivity(activityData)
      }

      onActivityCreated?.()
      handleClose()
    } catch (err) {
      console.error('Failed to create activity:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeInfo = (type: ActivityType) => activityTypes.find(t => t.value === type)

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl z-40"
        title="Quick Add Activity"
      >
        +
      </button>

      {/* Quick Add Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
            <div className="flex min-h-full items-end sm:items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="bg-fuchsia-500 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-white">
                      {step === 'recent' && 'Quick Add Activity'}
                      {step === 'type' && 'Select Activity Type'}
                      {step === 'details' && 'Activity Details'}
                    </Dialog.Title>
                    <p className="text-fuchsia-200 text-sm mt-1">
                      {step === 'recent' && 'Tap to log or create new'}
                      {step === 'type' && 'What kind of activity?'}
                      {step === 'details' && 'Almost done!'}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Step: Recent Activities */}
                    {step === 'recent' && (
                      <div className="space-y-4">
                        {recentTemplates.length > 0 && (
                          <>
                            <div className="text-sm font-medium text-gray-500 mb-2">Recent Activities</div>
                            <div className="grid grid-cols-2 gap-3">
                              {recentTemplates.map((template, index) => {
                                const student = getStudentById(template.studentId)
                                const subject = getSubjectById(template.subjectId)
                                const typeInfo = getTypeInfo(template.activityType)
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleQuickLog(template)}
                                    disabled={isLoading}
                                    className="p-3 bg-gray-50 hover:bg-fuchsia-50 rounded-lg text-left transition-colors disabled:opacity-50 border border-gray-200 hover:border-fuchsia-300"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg">{typeInfo?.icon}</span>
                                      <span className="text-xs text-gray-500">{subject?.name}</span>
                                    </div>
                                    <div className="font-medium text-gray-900 text-sm truncate">
                                      {template.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {student?.name}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setStep('type')}
                            className="w-full py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg font-medium transition-colors"
                          >
                            + New Activity
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step: Activity Type Selection */}
                    {step === 'type' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          {activityTypes.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => {
                                setSelectedType(type.value)
                                setStep('details')
                              }}
                              className="p-3 bg-gray-50 hover:bg-fuchsia-50 rounded-lg text-center transition-colors border border-gray-200 hover:border-fuchsia-300"
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div className="text-xs text-gray-700">{type.label}</div>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setStep('recent')}
                          className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Back
                        </button>
                      </div>
                    )}

                    {/* Step: Details */}
                    {step === 'details' && (
                      <div className="space-y-4">
                        {/* Selected Type Display */}
                        <div className="flex items-center gap-3 p-3 bg-fuchsia-50 rounded-lg">
                          <span className="text-2xl">{getTypeInfo(selectedType)?.icon}</span>
                          <div>
                            <div className="font-medium text-fuchsia-900">{getTypeInfo(selectedType)?.label}</div>
                            <button
                              onClick={() => setStep('type')}
                              className="text-xs text-fuchsia-600 hover:text-fuchsia-800"
                            >
                              Change
                            </button>
                          </div>
                        </div>

                        {/* Student Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                          <div className="flex flex-wrap gap-2">
                            {students.map((student) => (
                              <button
                                key={student.id}
                                onClick={() => {
                                  if (selectedStudentIds.includes(student.id)) {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                                  } else {
                                    setSelectedStudentIds([...selectedStudentIds, student.id])
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  selectedStudentIds.includes(student.id)
                                    ? 'bg-fuchsia-100 text-fuchsia-700 ring-2 ring-fuchsia-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {student.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subject Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((subject) => (
                              <button
                                key={subject.id}
                                onClick={() => setSelectedSubjectId(subject.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  selectedSubjectId === subject.id
                                    ? 'bg-fuchsia-100 text-fuchsia-700 ring-2 ring-fuchsia-500'
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">Activity Title</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Chapter 5 worksheet"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                            autoFocus
                          />
                          {/* AI Subject Suggestions based on title */}
                          {title.length >= 5 && !selectedSubjectId && (
                            <SubjectSuggestions
                              description={title}
                              subjects={subjects}
                              onSelect={setSelectedSubjectId}
                              selectedSubjectId={selectedSubjectId}
                            />
                          )}
                        </div>

                        {/* Duration Quick Select */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (optional)</label>
                          <div className="flex flex-wrap gap-2">
                            {durationOptions.map((mins) => (
                              <button
                                key={mins}
                                onClick={() => setDuration(duration === mins ? null : mins)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  duration === mins
                                    ? 'bg-fuchsia-100 text-fuchsia-700 ring-2 ring-fuchsia-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {mins} min
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setStep('type')}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={isLoading || !selectedSubjectId || !title.trim() || selectedStudentIds.length === 0}
                            className="flex-1 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Saving...' : 'Log Activity'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
