import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Dialog, Tab } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import { useMilestones } from '../hooks/useDatabase'
import { MilestoneCertificate } from '../features/certificates'
import type { Milestone, UpdateMilestone, MilestoneResource, CreateResource } from '../../../shared/types'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed'

const statusLabels: Record<Milestone['status'], { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' }
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
          ? 'bg-green-50 border-l-green-500'
          : milestone.status === 'in_progress'
            ? 'bg-amber-50 border-l-amber-500'
            : 'bg-gray-50 border-l-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900">{milestone.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {milestone.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-600">
                {milestone.category}
              </span>
            )}
            {resources.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {resources.length} resource{resources.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
          {milestone.targetDate && (
            <p className="text-xs text-gray-400 mt-2">
              Target: {format(parseISO(milestone.targetDate), 'MMM d, yyyy')}
            </p>
          )}
          {milestone.evidenceNotes && (
            <p className="text-sm text-gray-500 mt-2 italic">Notes: {milestone.evidenceNotes}</p>
          )}

          {/* Resources Section */}
          <div className="mt-3">
            <button
              onClick={() => setShowResources(!showResources)}
              className="text-xs text-fuchsia-600 hover:text-fuchsia-700"
            >
              {showResources ? 'Hide Resources' : 'Show Resources'}
            </button>

            {showResources && (
              <div className="mt-2 space-y-2">
                {resources.length === 0 ? (
                  <p className="text-xs text-gray-400">No resources yet</p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-2 text-sm bg-white p-2 rounded border"
                    >
                      <span className="text-lg">
                        {resource.type === 'url' ? '🔗' : '📄'}
                      </span>
                      <button
                        onClick={() => handleOpenResource(resource)}
                        className="text-blue-600 hover:underline flex-1 text-left truncate"
                      >
                        {resource.title}
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setShowAddResource(true)}
                  className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded hover:bg-fuchsia-200"
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
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={onEdit} className="text-fuchsia-600 hover:text-fuchsia-700 text-sm">
            Edit
          </button>
          {milestone.status === 'completed' && (
            <button
              onClick={onPrintCertificate}
              className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
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
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Add Resource
            </Dialog.Title>

            <Tab.Group>
              <Tab.List className="flex gap-2 mb-4">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'
                    }`
                  }
                >
                  URL / Link
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'
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
  const { subjects, selectedStudentId, getSelectedStudent, getSubjectById } = useStore()
  const selectedStudent = getSelectedStudent()
  const { milestones, updateMilestone, initializeMilestones } = useMilestones(
    selectedStudentId || undefined
  )

  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editForm, setEditForm] = useState<UpdateMilestone>({})
  const [isInitializing, setIsInitializing] = useState(false)
  const [certificateMilestone, setCertificateMilestone] = useState<Milestone | null>(null)

  const groupedMilestones = useMemo(() => {
    let filtered = milestones

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
  }, [milestones, filterSubject, filterStatus])

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

  if (!selectedStudent) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Milestones</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500">Please select a student or add one in Settings.</p>
        </div>
      </div>
    )
  }

  if (milestones.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Milestones</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No milestones set up for {selectedStudent.name} yet.</p>
          <p className="text-sm text-gray-400 mb-6">
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedStudent.name} - {selectedStudent.gradeLevel.toUpperCase()} Grade
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-fuchsia-600">{stats.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
            <div className="text-gray-500">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">{stats.notStarted}</div>
            <div className="text-gray-500">Not Started</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
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
                    ? 'bg-fuchsia-100 text-fuchsia-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {/* Milestones by Subject */}
      <div className="space-y-6">
        {Object.entries(groupedMilestones).map(([subjectId, subjectMilestones]) => {
          const subject = getSubjectById(subjectId)
          const subjectCompleted = subjectMilestones.filter((m) => m.status === 'completed').length
          const subjectTotal = subjectMilestones.length

          return (
            <div key={subjectId} className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{subject?.name}</h2>
                <span className="text-sm text-gray-500">
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

      {Object.keys(groupedMilestones).length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-500">No milestones match your filters.</p>
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
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Edit Milestone
            </Dialog.Title>

            {editingMilestone && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="label">Milestone</label>
                  <p className="text-gray-700 font-medium">{editingMilestone.title}</p>
                  <p className="text-sm text-gray-500">{editingMilestone.description}</p>
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
