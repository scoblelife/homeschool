import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Dialog, Tab } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import { useMilestones } from '../hooks/useDatabase'
import { MilestoneCertificate } from '../features/certificates'
import type { Milestone, UpdateMilestone, MilestoneResource, CreateResource } from '../../../shared/types'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed'

const statusLabels: Record<Milestone['status'], { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  in_progress: { label: 'In Progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50' },
  completed: { label: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' }
}

function MilestoneCard({
  milestone,
  onStatusChange,
  onEdit,
  onPrintCertificate
}: {
  milestone: Milestone
  onStatusChange: (status: Milestone['status']) => void
  onEdit: () => void
  onPrintCertificate: () => void
}) {
  const [resources, setResources] = useState<MilestoneResource[]>([])
  const [showResources, setShowResources] = useState(false)
  const [showAddResource, setShowAddResource] = useState(false)
  const [urlForm, setUrlForm] = useState({ title: '', url: '' })
  const [fileTitle, setFileTitle] = useState('')

  useEffect(() => {
    loadResources()
  }, [milestone.id])

  const loadResources = async () => {
    const data = await window.api.getResources(milestone.id)
    setResources(data)
  }

  const handleAddUrl = async () => {
    if (!urlForm.title || !urlForm.url) return
    const data: CreateResource = {
      milestoneId: milestone.id,
      type: 'url',
      title: urlForm.title,
      url: urlForm.url
    }
    await window.api.createResource(data)
    setUrlForm({ title: '', url: '' })
    setShowAddResource(false)
    loadResources()
  }

  const handleUploadFile = async () => {
    const resource = await window.api.uploadResourceFile(milestone.id, fileTitle)
    if (resource) {
      setFileTitle('')
      setShowAddResource(false)
      loadResources()
    }
  }

  const handleDeleteResource = async (id: string) => {
    await window.api.deleteResource(id)
    loadResources()
  }

  const handleOpenResource = async (resource: MilestoneResource) => {
    await window.api.openResource(resource)
  }

  const statusInfo = statusLabels[milestone.status]

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        milestone.status === 'completed'
          ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500'
          : milestone.status === 'in_progress'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500'
            : 'bg-gray-50 dark:bg-gray-700/50 border-l-gray-300 dark:border-l-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {milestone.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-300">
                {milestone.category}
              </span>
            )}
            {resources.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                {resources.length} resource{resources.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{milestone.description}</p>
          {milestone.targetDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Target: {format(parseISO(milestone.targetDate), 'MMM d, yyyy')}
            </p>
          )}
          {milestone.evidenceNotes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">Notes: {milestone.evidenceNotes}</p>
          )}

          {/* Resources Section */}
          <div className="mt-3">
            <button
              onClick={() => setShowResources(!showResources)}
              className="text-xs text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
            >
              {showResources ? 'Hide Resources' : 'Show Resources'}
            </button>

            {showResources && (
              <div className="mt-2 space-y-2">
                {resources.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No resources yet</p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-lg">
                        {resource.type === 'url' ? '🔗' : '📄'}
                      </span>
                      <button
                        onClick={() => handleOpenResource(resource)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex-1 text-left truncate"
                      >
                        {resource.title}
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setShowAddResource(true)}
                  className="text-xs bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300 px-2 py-1 rounded hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/70"
                >
                  + Add Resource
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={milestone.status}
            onChange={(e) => onStatusChange(e.target.value as Milestone['status'])}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={onEdit} className="text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 dark:hover:text-fuchsia-300 text-sm">
            Edit
          </button>
          {milestone.status === 'completed' && (
            <button
              onClick={onPrintCertificate}
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Certificate
            </button>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      <Dialog open={showAddResource} onClose={() => setShowAddResource(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Resource
            </Dialog.Title>

            <Tab.Group>
              <Tab.List className="flex gap-2 mb-4">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`
                  }
                >
                  URL / Link
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`
                  }
                >
                  Upload File
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      value={urlForm.title}
                      onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                      className="input"
                      placeholder="e.g., Khan Academy - Counting"
                    />
                  </div>
                  <div>
                    <label className="label">URL</label>
                    <input
                      type="url"
                      value={urlForm.url}
                      onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                      className="input"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddResource(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleAddUrl} className="btn btn-primary">
                      Add URL
                    </button>
                  </div>
                </Tab.Panel>
                <Tab.Panel className="space-y-4">
                  <div>
                    <label className="label">Title (optional)</label>
                    <input
                      type="text"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      className="input"
                      placeholder="Leave blank to use filename"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddResource(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleUploadFile} className="btn btn-primary">
                      Choose File...
                    </button>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

export default function Milestones(): JSX.Element {
  const { subjects, students, selectedStudentId, getSelectedStudent, getSubjectById, getStudentById } = useStore()
  const selectedStudent = getSelectedStudent()
  // Pass undefined to fetch ALL milestones when no student selected
  const { milestones, isLoading, updateMilestone, initializeMilestones } = useMilestones(
    selectedStudentId || undefined
  )

  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterStudent, setFilterStudent] = useState<string>('') // For "All Students" view
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editForm, setEditForm] = useState<UpdateMilestone>({})
  const [isInitializing, setIsInitializing] = useState(false)
  const [certificateMilestone, setCertificateMilestone] = useState<Milestone | null>(null)

  // Check if we're in "All Students" mode
  const isAllStudentsMode = !selectedStudentId

  const groupedMilestones = useMemo(() => {
    let filtered = milestones

    // Filter by student (only applies in "All Students" mode)
    if (isAllStudentsMode && filterStudent) {
      filtered = filtered.filter((m) => m.studentId === filterStudent)
    }

    if (filterSubject) {
      filtered = filtered.filter((m) => m.subjectId === filterSubject)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus)
    }

    const grouped: Record<string, Milestone[]> = {}
    for (const milestone of filtered) {
      if (!grouped[milestone.subjectId]) {
        grouped[milestone.subjectId] = []
      }
      grouped[milestone.subjectId].push(milestone)
    }

    return grouped
  }, [milestones, filterSubject, filterStatus, isAllStudentsMode, filterStudent])

  // Group milestones by student (for "All Students" mode)
  const groupedByStudent = useMemo(() => {
    if (!isAllStudentsMode) return {}

    let filtered = milestones

    if (filterSubject) {
      filtered = filtered.filter((m) => m.subjectId === filterSubject)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus)
    }

    const grouped: Record<string, Record<string, Milestone[]>> = {}
    for (const milestone of filtered) {
      if (!grouped[milestone.studentId]) {
        grouped[milestone.studentId] = {}
      }
      if (!grouped[milestone.studentId][milestone.subjectId]) {
        grouped[milestone.studentId][milestone.subjectId] = []
      }
      grouped[milestone.studentId][milestone.subjectId].push(milestone)
    }

    return grouped
  }, [milestones, filterSubject, filterStatus, isAllStudentsMode])

  const stats = useMemo(() => {
    const total = milestones.length
    const completed = milestones.filter((m) => m.status === 'completed').length
    const inProgress = milestones.filter((m) => m.status === 'in_progress').length
    const notStarted = milestones.filter((m) => m.status === 'not_started').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, notStarted, percentage }
  }, [milestones])

  const handleStatusChange = async (milestone: Milestone, newStatus: Milestone['status']) => {
    await updateMilestone(milestone.id, { status: newStatus })
  }

  const handleInitialize = async () => {
    if (!selectedStudent) return
    setIsInitializing(true)
    try {
      await initializeMilestones(selectedStudent.id, selectedStudent.gradeLevel)
    } finally {
      setIsInitializing(false)
    }
  }

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setEditForm({
      targetDate: milestone.targetDate || '',
      evidenceNotes: milestone.evidenceNotes
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMilestone) return

    await updateMilestone(editingMilestone.id, {
      targetDate: editForm.targetDate || null,
      evidenceNotes: editForm.evidenceNotes || ''
    })
    setEditingMilestone(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Milestones</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading milestones...</p>
        </div>
      </div>
    )
  }

  // If no students exist at all
  if (students.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Milestones</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Please add a student in Settings to get started.</p>
        </div>
      </div>
    )
  }

  // Single student selected but no milestones
  if (selectedStudent && milestones.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Milestones</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No milestones set up for {selectedStudent.name} yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Initialize milestones for {selectedStudent.gradeLevel.toUpperCase()} grade level?
          </p>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="btn btn-primary"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Milestones'}
          </button>
        </div>
      </div>
    )
  }

  // All students mode but no milestones at all
  if (isAllStudentsMode && milestones.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Milestones - All Students</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No milestones have been set up for any student yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Select a specific student from the sidebar to initialize their milestones.
          </p>
        </div>
      </div>
    )
  }

  // Helper function to get student color class
  const getStudentColorClass = (color?: string): string => {
    const colorMap: Record<string, string> = {
      fuchsia: 'bg-fuchsia-500',
      teal: 'bg-teal-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500'
    }
    return colorMap[color || 'fuchsia'] || 'bg-fuchsia-500'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAllStudentsMode ? 'Milestones - All Students' : 'Milestones'}
          </h1>
          {selectedStudent && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedStudent.name} - {selectedStudent.gradeLevel.toUpperCase()} Grade
            </p>
          )}
          {isAllStudentsMode && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Viewing milestones for {students.length} student{students.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Overall Progress</span>
          <span className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">{stats.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</div>
            <div className="text-gray-500 dark:text-gray-400">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">{stats.notStarted}</div>
            <div className="text-gray-500 dark:text-gray-400">Not Started</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Student filter (only in All Students mode) */}
        {isAllStudentsMode && (
          <div>
            <label className="label text-xs">Student</label>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label text-xs">Subject</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="input py-1.5 text-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-xs">Status</label>
          <div className="flex gap-1">
            {(['all', 'not_started', 'in_progress', 'completed'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status === 'not_started'
                    ? 'Not Started'
                    : status === 'in_progress'
                      ? 'In Progress'
                      : 'Completed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones grouped by student (All Students mode) */}
      {isAllStudentsMode && !filterStudent && (
        <div className="space-y-8">
          {Object.entries(groupedByStudent).map(([studentId, subjectGroups]) => {
            const student = getStudentById(studentId)
            if (!student) return null

            const studentMilestones = Object.values(subjectGroups).flat()
            const studentCompleted = studentMilestones.filter((m) => m.status === 'completed').length
            const studentTotal = studentMilestones.length
            const studentPercentage = studentTotal > 0 ? Math.round((studentCompleted / studentTotal) * 100) : 0

            return (
              <div key={studentId} className="space-y-4">
                {/* Student Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className={`w-4 h-4 rounded-full ${getStudentColorClass(student.color)}`} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{student.name}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">{student.gradeLevel}</span>
                  <span className="ml-auto text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">
                    {studentPercentage}% complete ({studentCompleted}/{studentTotal})
                  </span>
                </div>

                {/* Milestones by Subject for this student */}
                {Object.entries(subjectGroups).map(([subjectId, subjectMilestones]) => {
                  const subject = getSubjectById(subjectId)
                  const subjectCompleted = subjectMilestones.filter((m) => m.status === 'completed').length
                  const subjectTotal = subjectMilestones.length

                  return (
                    <div key={`${studentId}-${subjectId}`} className="card ml-7">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subject?.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {subjectCompleted}/{subjectTotal} completed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {subjectMilestones.map((milestone) => (
                          <MilestoneCard
                            key={milestone.id}
                            milestone={milestone}
                            onStatusChange={(status) => handleStatusChange(milestone, status)}
                            onEdit={() => openEditModal(milestone)}
                            onPrintCertificate={() => setCertificateMilestone(milestone)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Milestones by Subject (single student mode OR filtered to single student) */}
      {(!isAllStudentsMode || filterStudent) && (
        <div className="space-y-6">
          {Object.entries(groupedMilestones).map(([subjectId, subjectMilestones]) => {
            const subject = getSubjectById(subjectId)
            const subjectCompleted = subjectMilestones.filter((m) => m.status === 'completed').length
            const subjectTotal = subjectMilestones.length

            return (
              <div key={subjectId} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{subject?.name}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {subjectCompleted}/{subjectTotal} completed
                  </span>
                </div>

                <div className="space-y-3">
                  {subjectMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onStatusChange={(status) => handleStatusChange(milestone, status)}
                      onEdit={() => openEditModal(milestone)}
                      onPrintCertificate={() => setCertificateMilestone(milestone)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state for filtered results */}
      {((!isAllStudentsMode || filterStudent) && Object.keys(groupedMilestones).length === 0) && (
        <div className="card text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No milestones match your filters.</p>
        </div>
      )}

      {(isAllStudentsMode && !filterStudent && Object.keys(groupedByStudent).length === 0) && (
        <div className="card text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No milestones match your filters.</p>
        </div>
      )}

      {/* Edit Milestone Modal */}
      <Dialog
        open={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Milestone
            </Dialog.Title>

            {editingMilestone && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="label">Milestone</label>
                  <p className="text-gray-700 dark:text-gray-200 font-medium">{editingMilestone.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{editingMilestone.description}</p>
                </div>

                <div>
                  <label className="label">Target Date</label>
                  <input
                    type="date"
                    value={editForm.targetDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Evidence / Notes</label>
                  <textarea
                    value={editForm.evidenceNotes || ''}
                    onChange={(e) => setEditForm({ ...editForm, evidenceNotes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Document evidence of mastery, resources used, etc."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingMilestone(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Milestone Certificate Modal */}
      {certificateMilestone && (
        <MilestoneCertificate
          milestone={certificateMilestone}
          isOpen={!!certificateMilestone}
          onClose={() => setCertificateMilestone(null)}
        />
      )}
    </div>
  )
}
