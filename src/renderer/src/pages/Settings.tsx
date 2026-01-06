import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Dialog } from '@headlessui/react'
import { useStudents } from '../hooks/useDatabase'
import { SyncSettings } from '../components/sync'
import type { CreateStudent, GradeLevel, GoogleCalendarInfo, Subject, SubjectChoreMapping } from '../../../shared/types'

export default function Settings(): JSX.Element {
  const { students, createStudent, updateStudent, deleteStudent } = useStudents()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    dateOfBirth: string
    gradeLevel: GradeLevel
    color: 'child1' | 'child2'
    calendarFeedUrl: string
  }>({
    name: '',
    dateOfBirth: '',
    gradeLevel: 'pre-k',
    color: 'child1',
    calendarFeedUrl: ''
  })

  // Google Calendar state
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{ hasCredentials: boolean; isAuthenticated: boolean } | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Skylight Chore Mapping state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [choreMappings, setChoreMappings] = useState<SubjectChoreMapping[]>([])
  const [mappingForm, setMappingForm] = useState<Record<string, { choreName: string; defaultStars: number }>>({})

  // Load Google auth status on mount
  useEffect(() => {
    loadGoogleAuthStatus()
  }, [])

  // Load subjects and chore mappings on mount
  useEffect(() => {
    loadSubjectsAndMappings()
  }, [])

  const loadSubjectsAndMappings = async (): Promise<void> => {
    const [subjectList, mappingList] = await Promise.all([
      window.api.getSubjects(),
      window.api.getChoreMappings()
    ])
    setSubjects(subjectList)
    setChoreMappings(mappingList)

    // Initialize form with existing mappings
    const formData: Record<string, { choreName: string; defaultStars: number }> = {}
    for (const subject of subjectList) {
      const mapping = mappingList.find(m => m.subjectId === subject.id)
      formData[subject.id] = {
        choreName: mapping?.choreName || '',
        defaultStars: mapping?.defaultStars || 1
      }
    }
    setMappingForm(formData)
  }

  const handleSaveMapping = async (subjectId: string): Promise<void> => {
    const data = mappingForm[subjectId]
    if (!data.choreName.trim()) {
      // Delete mapping if chore name is empty
      await window.api.deleteChoreMapping(subjectId)
    } else {
      await window.api.upsertChoreMapping({
        subjectId,
        choreName: data.choreName.trim(),
        defaultStars: data.defaultStars
      })
    }
    await loadSubjectsAndMappings()
  }

  const loadGoogleAuthStatus = async (): Promise<void> => {
    const status = await window.api.getGoogleAuthStatus()
    setGoogleAuthStatus(status)

    if (status.isAuthenticated) {
      // Load calendars and selected calendar
      const calendarList = await window.api.listGoogleCalendars()
      setCalendars(calendarList)

      const savedCalendarId = await window.api.getSetting('google_calendar_id')
      setSelectedCalendarId(savedCalendarId)
    }
  }

  const handleConnectGoogle = async (): Promise<void> => {
    setIsConnecting(true)
    try {
      await window.api.connectGoogleCalendar()
      await loadGoogleAuthStatus()
    } catch (error) {
      console.error('Failed to connect:', error)
      alert('Failed to connect to Google Calendar. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogle = async (): Promise<void> => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return
    await window.api.disconnectGoogleCalendar()
    setCalendars([])
    setSelectedCalendarId(null)
    await window.api.deleteSetting('google_calendar_id')
    loadGoogleAuthStatus()
  }

  const handleSelectCalendar = async (calendarId: string): Promise<void> => {
    setSelectedCalendarId(calendarId)
    await window.api.setSetting('google_calendar_id', calendarId)
  }

  const openAddModal = (): void => {
    setEditingStudent(null)
    setFormData({
      name: '',
      dateOfBirth: '',
      gradeLevel: 'pre-k',
      color: students.length === 0 ? 'child1' : 'child2',
      calendarFeedUrl: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (studentId: string): void => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    setEditingStudent(studentId)
    setFormData({
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gradeLevel: student.gradeLevel,
      color: student.color,
      calendarFeedUrl: student.calendarFeedUrl || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.name || !formData.dateOfBirth) return

    if (editingStudent) {
      await updateStudent(editingStudent, formData)
    } else {
      await createStudent(formData)
    }

    setIsModalOpen(false)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (confirm('Are you sure you want to delete this student? This will also delete all their activities and sessions.')) {
      await deleteStudent(id)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Students Section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Student
          </button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No students added yet.</p>
            <button onClick={openAddModal} className="btn btn-primary">
              Add Your First Student
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 ${
                  student.color === 'child1' ? 'border-l-fuchsia-500' : 'border-l-teal-500'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                    student.color === 'child1' ? 'bg-fuchsia-500' : 'bg-teal-500'
                  }`}
                >
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    {student.gradeLevel === 'pre-k' ? 'Pre-K' : student.gradeLevel === '1st' ? '1st Grade' : '2nd Grade'} •{' '}
                    Born {format(parseISO(student.dateOfBirth), 'MMMM d, yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(student.id)}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="btn btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Sync Section */}
      <div className="mb-8">
        <SyncSettings />
      </div>

      {/* Google Calendar Section */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Calendar Sync</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sync your weekly plan milestones to Google Calendar. Events will automatically appear on your Skylight calendar.
        </p>

        {googleAuthStatus === null ? (
          <div className="text-gray-500">Loading...</div>
        ) : !googleAuthStatus.isAuthenticated ? (
          <div className="space-y-4">
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800">Connected to Google Calendar</p>
                <p className="text-sm text-green-600">Ready to sync milestones</p>
              </div>
            </div>

            <div>
              <label className="label">Sync to Calendar</label>
              <select
                value={selectedCalendarId || ''}
                onChange={(e) => handleSelectCalendar(e.target.value)}
                className="input"
              >
                <option value="">Select a calendar...</option>
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Milestones from your weekly plan will be synced to this calendar.
              </p>
            </div>

            <button onClick={handleDisconnectGoogle} className="btn btn-secondary text-red-600">
              Disconnect Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Skylight Chore Mapping Section */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Skylight Chore Mapping</h2>
        <p className="text-sm text-gray-600 mb-4">
          Map each subject to a Skylight chore name. When you complete milestones, you'll see these names in the daily checklist.
        </p>

        {subjects.length === 0 ? (
          <div className="text-gray-500">Loading subjects...</div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => {
              const formValue = mappingForm[subject.id] || { choreName: '', defaultStars: 1 }
              const hasMapping = choreMappings.some(m => m.subjectId === subject.id)

              return (
                <div key={subject.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-32 font-medium text-gray-700 truncate">{subject.name}</div>
                  <span className="text-gray-400">→</span>
                  <input
                    type="text"
                    value={formValue.choreName}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        [subject.id]: { ...formValue, choreName: e.target.value }
                      })
                    }
                    onBlur={() => handleSaveMapping(subject.id)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Skylight chore name..."
                  />
                  <span className="text-yellow-500">⭐</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formValue.defaultStars}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        [subject.id]: { ...formValue, defaultStars: parseInt(e.target.value) || 1 }
                      })
                    }
                    onBlur={() => handleSaveMapping(subject.id)}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {hasMapping && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          These mappings are used when generating the daily Skylight checklist for completed milestones.
        </p>
      </div>

      {/* About Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Homeschool Manager</strong> v0.1.3</p>
          <p>A desktop application for managing homeschool education.</p>
          <p>Data is stored locally on your device. Family sync uses encrypted peer-to-peer connections - your data never touches our servers.</p>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeLevel: e.target.value as GradeLevel })
                  }
                  className="input"
                >
                  <option value="pre-k">Pre-K (4 years old)</option>
                  <option value="1st">1st Grade (6 years old)</option>
                  <option value="2nd">2nd Grade (7 years old)</option>
                </select>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, color: 'child1' })}
                    className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      formData.color === 'child1'
                        ? 'ring-2 ring-fuchsia-500 bg-fuchsia-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-fuchsia-500" />
                    <span>Fuchsia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, color: 'child2' })}
                    className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      formData.color === 'child2'
                        ? 'ring-2 ring-teal-500 bg-teal-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-500" />
                    <span>Teal</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Google Calendar Feed URL (optional)</label>
                <input
                  type="url"
                  value={formData.calendarFeedUrl}
                  onChange={(e) => setFormData({ ...formData, calendarFeedUrl: e.target.value })}
                  className="input"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Google Calendar → Settings → Your Calendar → Secret address in iCal format
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

    </div>
  )
}
