import { useState, useEffect, useMemo, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import type { GradeLevel, LearningStandard, CurriculumPackage, CreateCurriculumPackage } from '../../../shared/types'
import { milestoneTemplates, MilestoneTemplateData } from '../../../database/milestones-data'
import { LEARNING_RESOURCES, LearningResource } from '../features/resources/resourceData'

type TabType = 'milestones' | 'packages' | 'resources' | 'standards'

const gradeLabels: Record<GradeLevel, string> = {
  'pre-k': 'Pre-K',
  'k': 'Kindergarten',
  '1st': '1st Grade',
  '2nd': '2nd Grade',
  '3rd': '3rd Grade',
  '4th': '4th Grade',
  '5th': '5th Grade',
  '6th': '6th Grade',
  '7th': '7th Grade',
  '8th': '8th Grade',
  '9th': '9th Grade',
  '10th': '10th Grade',
  '11th': '11th Grade',
  '12th': '12th Grade'
}

const subjectLabels: Record<string, string> = {
  'math': 'Math',
  'science': 'Science',
  'reading': 'Reading',
  'language-arts': 'Language Arts',
  'history': 'History',
  'geography': 'Geography',
  'art': 'Art',
  'music': 'Music',
  'technology': 'Technology',
  'foreign-language': 'Foreign Language',
  'social-studies': 'Social Studies',
  'english': 'English',
  'health': 'Health',
  'social-emotional': 'Social-Emotional',
  'pe': 'Physical Education',
  'writing': 'Writing'
}

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState<TabType>('milestones')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Library</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Browse and manage curricula, resources, templates, and learning standards
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <TabButton
          active={activeTab === 'milestones'}
          onClick={() => setActiveTab('milestones')}
          icon="🎯"
          label="Milestone Templates"
          count={milestoneTemplates.length}
        />
        <TabButton
          active={activeTab === 'packages'}
          onClick={() => setActiveTab('packages')}
          icon="📦"
          label="Curriculum Packages"
        />
        <TabButton
          active={activeTab === 'resources'}
          onClick={() => setActiveTab('resources')}
          icon="🔗"
          label="Educational Resources"
          count={LEARNING_RESOURCES.length}
        />
        <TabButton
          active={activeTab === 'standards'}
          onClick={() => setActiveTab('standards')}
          icon="📋"
          label="Learning Standards"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'milestones' && <MilestoneTemplatesTab />}
      {activeTab === 'packages' && <CurriculumPackagesTab />}
      {activeTab === 'resources' && <ResourcesTab />}
      {activeTab === 'standards' && <StandardsTab />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        active
          ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
          : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
          active ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

// =============================================================================
// MILESTONE TEMPLATES TAB
// =============================================================================

function MilestoneTemplatesTab() {
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | 'all'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const grades = useMemo(() => {
    const unique = new Set(milestoneTemplates.map(m => m.gradeLevel))
    return Array.from(unique).sort((a, b) => {
      const order = Object.keys(gradeLabels)
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [])

  const subjects = useMemo(() => {
    const filtered = gradeFilter === 'all'
      ? milestoneTemplates
      : milestoneTemplates.filter(m => m.gradeLevel === gradeFilter)
    return Array.from(new Set(filtered.map(m => m.subjectId))).sort()
  }, [gradeFilter])

  const categories = useMemo(() => {
    let filtered = milestoneTemplates
    if (gradeFilter !== 'all') filtered = filtered.filter(m => m.gradeLevel === gradeFilter)
    if (subjectFilter !== 'all') filtered = filtered.filter(m => m.subjectId === subjectFilter)
    return Array.from(new Set(filtered.map(m => m.category))).sort()
  }, [gradeFilter, subjectFilter])

  const filteredMilestones = useMemo(() => {
    let filtered = milestoneTemplates
    if (gradeFilter !== 'all') filtered = filtered.filter(m => m.gradeLevel === gradeFilter)
    if (subjectFilter !== 'all') filtered = filtered.filter(m => m.subjectId === subjectFilter)
    if (categoryFilter !== 'all') filtered = filtered.filter(m => m.category === categoryFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [gradeFilter, subjectFilter, categoryFilter, searchQuery])

  // Group by category
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, MilestoneTemplateData[]> = {}
    filteredMilestones.forEach(m => {
      if (!groups[m.category]) groups[m.category] = []
      groups[m.category].push(m)
    })
    return groups
  }, [filteredMilestones])

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">About Milestone Templates</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          These are grade-appropriate learning milestones that can be assigned to students. They include
          pre-configured resources and are organized by subject and category.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value as GradeLevel | 'all')
            setSubjectFilter('all')
            setCategoryFilter('all')
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Grades</option>
          {grades.map(g => (
            <option key={g} value={g}>{gradeLabels[g]}</option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value)
            setCategoryFilter('all')
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s} value={s}>{subjectLabels[s] || s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
          <span className="font-semibold">{milestoneTemplates.length}</span>
        </div>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Showing: </span>
          <span className="font-semibold">{filteredMilestones.length}</span>
        </div>
      </div>

      {/* Milestones List */}
      {Object.keys(groupedMilestones).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">No milestones match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMilestones).map(([category, milestones]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300 rounded text-sm">
                  {category}
                </span>
                <span className="text-sm text-gray-500 font-normal">({milestones.length})</span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {milestones.map((m, idx) => (
                  <MilestoneCard key={`${m.gradeLevel}-${m.subjectId}-${idx}`} milestone={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MilestoneCard({ milestone }: { milestone: MilestoneTemplateData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
            {gradeLabels[milestone.gradeLevel]}
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {subjectLabels[milestone.subjectId] || milestone.subjectId}
          </span>
        </div>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>

      {milestone.resources && milestone.resources.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-fuchsia-600 hover:text-fuchsia-700"
          >
            {expanded ? 'Hide' : 'Show'} {milestone.resources.length} resource{milestone.resources.length > 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {milestone.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline truncate"
                >
                  {r.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CURRICULUM PACKAGES TAB
// =============================================================================

function CurriculumPackagesTab() {
  const [packages, setPackages] = useState<CurriculumPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadPackages = useCallback(async () => {
    try {
      const data = await window.api.getCurriculumPackages()
      setPackages(data)
    } catch (err) {
      console.error('Failed to load packages:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  const filteredPackages = useMemo(() => {
    if (!searchQuery) return packages
    const query = searchQuery.toLowerCase()
    return packages.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.publisher?.toLowerCase().includes(query) ||
      p.notes?.toLowerCase().includes(query)
    )
  }, [packages, searchQuery])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading packages...</div>
  }

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">About Curriculum Packages</h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          Track the commercial curriculum products your family uses (e.g., Saxon Math, Abeka, BJU Press).
          Link packages to subjects and grade levels for reference.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
        >
          Add Package
        </button>
      </div>

      {/* Packages List */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {packages.length === 0 ? 'No packages yet' : 'No matching packages'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {packages.length === 0
              ? 'Add the curriculum packages your family uses.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map(pkg => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onDelete={async () => {
                if (confirm('Delete this package?')) {
                  await window.api.deleteCurriculumPackage(pkg.id)
                  loadPackages()
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddPackageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          loadPackages()
        }}
      />
    </div>
  )
}

function PackageCard({ package: pkg, onDelete }: { package: CurriculumPackage; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{pkg.name}</h4>
          {pkg.publisher && (
            <p className="text-sm text-gray-500">{pkg.publisher}</p>
          )}
        </div>
        <span className={`px-2 py-0.5 text-xs rounded ${pkg.isActive ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          {pkg.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {pkg.subjectIds && pkg.subjectIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {pkg.subjectIds.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
              {subjectLabels[s] || s}
            </span>
          ))}
        </div>
      )}

      {pkg.gradeLevels && pkg.gradeLevels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pkg.gradeLevels.map(g => (
            <span key={g} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
              {gradeLabels[g as GradeLevel] || g}
            </span>
          ))}
        </div>
      )}

      {pkg.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">{pkg.notes}</p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        {pkg.websiteUrl ? (
          <a
            href={pkg.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Website
          </a>
        ) : (
          <span />
        )}
        <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-700">
          Delete
        </button>
      </div>
    </div>
  )
}

function AddPackageModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [publisher, setPublisher] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const allSubjects = Object.keys(subjectLabels)
  const allGrades = Object.keys(gradeLabels) as GradeLevel[]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      await window.api.createCurriculumPackage({
        name: name.trim(),
        publisher: publisher.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        subjectIds: subjectIds,
        gradeLevels: gradeLevels as GradeLevel[],
        isActive: true
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create package:', err)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setName('')
      setPublisher('')
      setWebsiteUrl('')
      setNotes('')
      setSubjectIds([])
      setGradeLevels([])
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Curriculum Package
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Saxon Math 5/4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g., Saxon Publishers"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subjects
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {allSubjects.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubjectIds(
                      subjectIds.includes(s)
                        ? subjectIds.filter(x => x !== s)
                        : [...subjectIds, s]
                    )}
                    className={`px-2 py-1 text-xs rounded ${
                      subjectIds.includes(s)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {subjectLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade Levels
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {allGrades.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeLevels(
                      gradeLevels.includes(g)
                        ? gradeLevels.filter(x => x !== g)
                        : [...gradeLevels, g]
                    )}
                    className={`px-2 py-1 text-xs rounded ${
                      gradeLevels.includes(g)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {gradeLabels[g]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Package'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// =============================================================================
// RESOURCES TAB
// =============================================================================

function ResourcesTab() {
  const resources = LEARNING_RESOURCES
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const subjects = useMemo(() => Array.from(new Set(resources.flatMap((r: LearningResource) => r.subjects))).sort(), [resources])
  const categories = useMemo(() => Array.from(new Set(resources.map((r: LearningResource) => r.category))).sort(), [resources])

  const categoryLabels: Record<string, string> = {
    video: 'Video Lessons',
    practice: 'Practice & Drills',
    reading: 'Reading',
    game: 'Educational Games',
    tool: 'Interactive Tools',
    reference: 'Reference'
  }

  const filteredResources = useMemo(() => {
    let filtered = resources
    if (subjectFilter !== 'all') filtered = filtered.filter((r: LearningResource) => r.subjects.includes(subjectFilter))
    if (categoryFilter !== 'all') filtered = filtered.filter((r: LearningResource) => r.category === categoryFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((r: LearningResource) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [resources, subjectFilter, categoryFilter, searchQuery])

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">About Educational Resources</h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Curated collection of educational websites, apps, and tools organized by subject and grade level.
          Click on any resource to open it in a new tab.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s} value={s}>{subjectLabels[s] || s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{categoryLabels[c] || c}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
          <span className="font-semibold">{resources.length}</span>
        </div>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Showing: </span>
          <span className="font-semibold">{filteredResources.length}</span>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">No resources match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((r: LearningResource) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource }: { resource: LearningResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center text-white text-lg">
          {resource.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">{resource.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
              {subjectLabels[resource.subjects[0]] || resource.subjects[0]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${resource.isFree ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'}`}>
              {resource.isFree ? 'Free' : 'Paid'}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">{resource.description}</p>
      <div className="mt-3 text-xs text-gray-400">
        Grades: {resource.gradeLevels.join(', ')}
      </div>
    </a>
  )
}

// =============================================================================
// STANDARDS TAB
// =============================================================================

function StandardsTab() {
  const [standards, setStandards] = useState<LearningStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | 'all'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await window.api.getAllStandards()
        setStandards(data)
      } catch (err) {
        console.error('Failed to load standards:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subjects = useMemo(() => {
    const unique = new Set(standards.map(s => s.subjectId))
    return Array.from(unique).sort()
  }, [standards])

  const grades = useMemo(() => {
    const unique = new Set(standards.map(s => s.gradeLevel))
    return Array.from(unique).sort((a, b) => {
      const order = Object.keys(gradeLabels)
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [standards])

  const filteredStandards = useMemo(() => {
    let filtered = standards
    if (gradeFilter !== 'all') filtered = filtered.filter(s => s.gradeLevel === gradeFilter)
    if (subjectFilter !== 'all') filtered = filtered.filter(s => s.subjectId === subjectFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.code.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.domain?.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [standards, gradeFilter, subjectFilter, searchQuery])

  // Group by domain
  const groupedStandards = useMemo(() => {
    const groups: Record<string, LearningStandard[]> = {}
    filteredStandards.forEach(s => {
      const domain = s.domain || 'Other'
      if (!groups[domain]) groups[domain] = []
      groups[domain].push(s)
    })
    return groups
  }, [filteredStandards])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading standards...</div>
  }

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">About Learning Standards</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Browse Common Core and other learning standards by grade and subject. Standards can be linked
          to activities to track curriculum coverage.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search standards..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value as GradeLevel | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Grades</option>
          {grades.map(g => (
            <option key={g} value={g}>{gradeLabels[g]}</option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
          <span className="font-semibold">{standards.length}</span>
        </div>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Showing: </span>
          <span className="font-semibold">{filteredStandards.length}</span>
        </div>
      </div>

      {/* Standards List */}
      {Object.keys(groupedStandards).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">No standards match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedStandards).map(([domain, stds]) => (
            <div key={domain}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-sm">{domain}</span>
                <span className="text-sm text-gray-500 font-normal">({stds.length})</span>
              </h3>
              <div className="space-y-2">
                {stds.map(s => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded whitespace-nowrap">
                        {s.code}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{s.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">{gradeLabels[s.gradeLevel]}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{subjectLabels[s.subjectId] || s.subjectId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
