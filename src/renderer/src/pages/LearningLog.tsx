import { useState } from 'react'
import { format } from 'date-fns'
import { Dialog } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import { useActivities } from '../hooks/useDatabase'
import type { CreateActivity, ActivityType } from '../../../shared/types'

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
  const { activities, createActivity, deleteActivity } = useActivities({
    studentId: selectedStudentId || undefined
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<ActivityType | ''>('')
  const [formData, setFormData] = useState<Partial<CreateActivity>>({
    studentId: selectedStudentId || '',
    subjectId: '',
    activityType: 'worksheet',
    title: '',
    description: '',
    dateCompleted: format(new Date(), 'yyyy-MM-dd'),
    durationMinutes: null,
    grade: null,
    maxGrade: null,
    notes: '',
    bookTitle: '',
    pagesRead: undefined,
    totalPages: undefined
  })

  const filteredActivities = filterType
    ? activities.filter((a) => a.activityType === filterType)
    : activities

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.studentId || !formData.subjectId || !formData.title) return

    await createActivity({
      studentId: formData.studentId,
      subjectId: formData.subjectId,
      sessionId: null,
      activityType: formData.activityType || 'worksheet',
      title: formData.title,
      description: formData.description || '',
      dateCompleted: formData.dateCompleted || format(new Date(), 'yyyy-MM-dd'),
      durationMinutes: formData.durationMinutes || null,
      grade: formData.grade || null,
      maxGrade: formData.maxGrade || null,
      notes: formData.notes || '',
      bookTitle: formData.bookTitle,
      pagesRead: formData.pagesRead,
      totalPages: formData.totalPages
    })

    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = (): void => {
    setFormData({
      studentId: selectedStudentId || '',
      subjectId: '',
      activityType: 'worksheet',
      title: '',
      description: '',
      dateCompleted: format(new Date(), 'yyyy-MM-dd'),
      durationMinutes: null,
      grade: null,
      maxGrade: null,
      notes: '',
      bookTitle: '',
      pagesRead: undefined,
      totalPages: undefined
    })
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
            filterType === '' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                ? 'bg-indigo-100 text-indigo-700'
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
                  student?.color === 'child1' ? 'border-l-fuchsia-500' : 'border-l-teal-500'
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
                    {format(new Date(activity.dateCompleted), 'MMM d, yyyy')}
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
                  {activity.notes && <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>}
                </div>
                <button
                  onClick={() => deleteActivity(activity.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
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
              Log Activity
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
                          ? 'bg-indigo-100 ring-2 ring-indigo-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xl">{type.icon}</div>
                      <div className="text-xs mt-1">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Student</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

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

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

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
                  Log Activity
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
