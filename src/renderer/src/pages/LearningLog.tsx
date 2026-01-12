import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Dialog } from '@headlessui/react'
import Markdown from 'react-markdown'
import { useStore } from '../stores/useStore'
import { useActivities } from '../hooks/useDatabase'
import { getStudentColor } from './Settings'
import type { Activity, CreateActivity, ActivityType } from '../../../shared/types'

const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'worksheet', label: 'Worksheet', icon: '📝' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'writing_print', label: 'Writing (Print)', icon: '✏️' },
  { value: 'writing_cursive', label: 'Writing (Cursive)', icon: '✍️' },
  { value: 'hands_on', label: 'Hands-on', icon: '🎨' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'assessment', label: 'Assessment', icon: '📋' },
  { value: 'field_trip', label: 'Field Trip', icon: '🚌' }
]

export default function Activities(): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const { activities, createActivity, updateActivity, deleteActivity } = useActivities({
    studentId: selectedStudentId || undefined
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [filterType, setFilterType] = useState<ActivityType | ''>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    selectedStudentId ? [selectedStudentId] : []
  )
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Omit<Partial<CreateActivity>, 'studentId' | 'notes'>>({
    subjectId: '',
    activityType: 'worksheet',
    title: '',
    description: '',
    dateCompleted: format(new Date(), 'yyyy-MM-dd'),
    durationMinutes: null,
    grade: null,
    maxGrade: null,
    bookTitle: '',
    pagesRead: undefined,
    totalPages: undefined
  })

  const filteredActivities = filterType
    ? activities.filter((a) => a.activityType === filterType)
    : activities

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.subjectId || !formData.title) return

    if (editingActivity) {
      // Update existing activity
      await updateActivity(editingActivity.id, {
        subjectId: formData.subjectId,
        activityType: formData.activityType || 'worksheet',
        title: formData.title,
        description: formData.description || '',
        dateCompleted: formData.dateCompleted || format(new Date(), 'yyyy-MM-dd'),
        durationMinutes: formData.durationMinutes || null,
        grade: formData.grade || null,
        maxGrade: formData.maxGrade || null,
        notes: studentNotes[editingActivity.studentId] || '',
        bookTitle: formData.bookTitle,
        pagesRead: formData.pagesRead,
        totalPages: formData.totalPages
      })
    } else {
      // Create new activity for each selected student
      if (selectedStudentIds.length === 0) return
      for (const studentId of selectedStudentIds) {
        await createActivity({
          studentId,
          subjectId: formData.subjectId,
          sessionId: null,
          activityType: formData.activityType || 'worksheet',
          title: formData.title,
          description: formData.description || '',
          dateCompleted: formData.dateCompleted || format(new Date(), 'yyyy-MM-dd'),
          durationMinutes: formData.durationMinutes || null,
          grade: formData.grade || null,
          maxGrade: formData.maxGrade || null,
          notes: studentNotes[studentId] || '',
          bookTitle: formData.bookTitle,
          pagesRead: formData.pagesRead,
          totalPages: formData.totalPages
        })
      }
    }

    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = (): void => {
    setEditingActivity(null)
    setSelectedStudentIds(selectedStudentId ? [selectedStudentId] : [])
    setStudentNotes({})
    setFormData({
      subjectId: '',
      activityType: 'worksheet',
      title: '',
      description: '',
      dateCompleted: format(new Date(), 'yyyy-MM-dd'),
      durationMinutes: null,
      grade: null,
      maxGrade: null,
      bookTitle: '',
      pagesRead: undefined,
      totalPages: undefined
    })
  }

  const openEditModal = (activity: Activity): void => {
    setEditingActivity(activity)
    setSelectedStudentIds([activity.studentId])
    setStudentNotes({ [activity.studentId]: activity.notes || '' })
    setFormData({
      subjectId: activity.subjectId,
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      dateCompleted: activity.dateCompleted,
      durationMinutes: activity.durationMinutes,
      grade: activity.grade,
      maxGrade: activity.maxGrade,
      bookTitle: activity.bookTitle || '',
      pagesRead: activity.pagesRead,
      totalPages: activity.totalPages
    })
    setIsModalOpen(true)
  }

  const showReadingFields = formData.activityType === 'reading'
  const showGradeFields = formData.activityType === 'assessment'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Learning Log</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Log Activity
        </button>
      </div>

      {/* Filter by type */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === '' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {activityTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === type.value
                ? 'bg-fuchsia-100 text-fuchsia-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No activities recorded yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">
            Log First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const student = getStudentById(activity.studentId)
            const subject = getSubjectById(activity.subjectId)
            const typeInfo = activityTypes.find((t) => t.value === activity.activityType)
            return (
              <div
                key={activity.id}
                className={`card flex items-start gap-4 border-l-4 ${
                  getStudentColor(student?.color || 'fuchsia').border
                }`}
              >
                <div className="text-2xl">{typeInfo?.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{activity.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {typeInfo?.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {subject?.name} • {student?.name} •{' '}
                    {format(parseISO(activity.dateCompleted), 'MMM d, yyyy')}
                    {activity.durationMinutes && ` • ${activity.durationMinutes} min`}
                  </div>
                  {activity.bookTitle && (
                    <div className="text-sm text-gray-600 mt-1">
                      📚 {activity.bookTitle}
                      {activity.pagesRead && ` (${activity.pagesRead} pages)`}
                    </div>
                  )}
                  {activity.grade !== null && activity.maxGrade !== null && (
                    <div className="text-sm text-gray-600 mt-1">
                      Grade: {activity.grade}/{activity.maxGrade} (
                      {Math.round((activity.grade / activity.maxGrade) * 100)}%)
                    </div>
                  )}
                  {activity.notes && (
                    <div className="text-sm text-gray-600 mt-2 prose prose-sm max-w-none">
                      <Markdown>{activity.notes}</Markdown>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openEditModal(activity)}
                    className="text-fuchsia-500 hover:text-fuchsia-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Activity Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingActivity ? 'Edit Activity' : 'Log Activity'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, activityType: type.value })}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        formData.activityType === type.value
                          ? 'bg-fuchsia-100 ring-2 ring-fuchsia-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xl">{type.icon}</div>
                      <div className="text-xs mt-1">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {editingActivity ? (
                <div>
                  <label className="label">Student</label>
                  <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    {getStudentById(editingActivity.studentId)?.name}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">Students *</label>
                  <div className="flex flex-wrap gap-2">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (selectedStudentIds.includes(s.id)) {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id))
                            setStudentNotes((prev) => {
                              const updated = { ...prev }
                              delete updated[s.id]
                              return updated
                            })
                          } else {
                            setSelectedStudentIds([...selectedStudentIds, s.id])
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedStudentIds.includes(s.id)
                            ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {selectedStudentIds.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Select at least one student</p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Math worksheet Chapter 5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={formData.dateCompleted}
                    onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: e.target.value ? parseInt(e.target.value) : null
                      })
                    }
                    className="input"
                    min="1"
                  />
                </div>
              </div>

              {showReadingFields && (
                <>
                  <div>
                    <label className="label">Book Title</label>
                    <input
                      type="text"
                      value={formData.bookTitle}
                      onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Pages Read</label>
                      <input
                        type="number"
                        value={formData.pagesRead || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pagesRead: e.target.value ? parseInt(e.target.value) : undefined
                          })
                        }
                        className="input"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="label">Total Pages</label>
                      <input
                        type="number"
                        value={formData.totalPages || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalPages: e.target.value ? parseInt(e.target.value) : undefined
                          })
                        }
                        className="input"
                        min="1"
                      />
                    </div>
                  </div>
                </>
              )}

              {showGradeFields && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Score</label>
                    <input
                      type="number"
                      value={formData.grade || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grade: e.target.value ? parseFloat(e.target.value) : null
                        })
                      }
                      className="input"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="label">Max Score</label>
                    <input
                      type="number"
                      value={formData.maxGrade || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxGrade: e.target.value ? parseFloat(e.target.value) : null
                        })
                      }
                      className="input"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              )}

              {selectedStudentIds.length > 0 && (
                <div className="space-y-3">
                  <label className="label">
                    Notes {selectedStudentIds.length > 1 && '(per student)'}
                  </label>
                  {selectedStudentIds.map((studentId) => {
                    const student = students.find((s) => s.id === studentId)
                    return (
                      <div key={studentId}>
                        {selectedStudentIds.length > 1 && (
                          <label className={`text-sm font-medium ${
                            getStudentColor(student?.color || 'fuchsia').text
                          }`}>
                            {student?.name}
                          </label>
                        )}
                        <textarea
                          value={studentNotes[studentId] || ''}
                          onChange={(e) =>
                            setStudentNotes((prev) => ({ ...prev, [studentId]: e.target.value }))
                          }
                          className="input"
                          rows={2}
                          placeholder={selectedStudentIds.length > 1
                            ? `What did ${student?.name} learn?`
                            : 'Notes about this activity...'
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingActivity ? 'Save Changes' : 'Log Activity'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
