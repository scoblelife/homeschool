import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import type { CurriculumPackage, CreateCurriculumPackage, GradeLevel } from '../../../../shared/types'

// Popular curriculum packages for suggestions
const POPULAR_PACKAGES = [
  { name: 'Saxon Math', publisher: 'Saxon Publishers' },
  { name: 'Abeka', publisher: 'Pensacola Christian College' },
  { name: 'BJU Press', publisher: 'Bob Jones University' },
  { name: 'Math-U-See', publisher: 'Demme Learning' },
  { name: 'Singapore Math', publisher: 'Marshall Cavendish' },
  { name: 'Teaching Textbooks', publisher: 'Teaching Textbooks' },
  { name: 'All About Reading', publisher: 'All About Learning Press' },
  { name: 'Sonlight', publisher: 'Sonlight Curriculum' },
  { name: 'Mystery of History', publisher: 'Bright Ideas Press' },
  { name: 'Story of the World', publisher: 'Well-Trained Mind Press' },
  { name: 'Life of Fred', publisher: 'Stanley Schmidt' },
  { name: 'Classical Conversations', publisher: 'Classical Conversations' },
]

const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: 'pre-k', label: 'Pre-K' },
  { value: '1st', label: '1st Grade' },
  { value: '2nd', label: '2nd Grade' },
  { value: '3rd', label: '3rd Grade' },
  { value: '4th', label: '4th Grade' },
  { value: '5th', label: '5th Grade' },
]

export function CurriculumPackages() {
  const { subjects } = useStore()
  const [packages, setPackages] = useState<CurriculumPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateCurriculumPackage>>({
    name: '',
    publisher: '',
    subjectIds: [],
    gradeLevels: [],
    websiteUrl: '',
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    setIsLoading(true)
    try {
      const data = await window.api.getCurriculumPackages()
      setPackages(data)
    } catch (err) {
      console.error('Failed to load packages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    try {
      if (editingId) {
        await window.api.updateCurriculumPackage(editingId, formData)
      } else {
        await window.api.createCurriculumPackage(formData as CreateCurriculumPackage)
      }
      await loadPackages()
      resetForm()
    } catch (err) {
      console.error('Failed to save package:', err)
    }
  }

  const handleEdit = (pkg: CurriculumPackage) => {
    setEditingId(pkg.id)
    setFormData({
      name: pkg.name,
      publisher: pkg.publisher || '',
      subjectIds: pkg.subjectIds,
      gradeLevels: pkg.gradeLevels,
      websiteUrl: pkg.websiteUrl || '',
      notes: pkg.notes || '',
      isActive: pkg.isActive,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    try {
      await window.api.deleteCurriculumPackage(id)
      await loadPackages()
    } catch (err) {
      console.error('Failed to delete package:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      publisher: '',
      subjectIds: [],
      gradeLevels: [],
      websiteUrl: '',
      notes: '',
      isActive: true,
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const toggleSubject = (subjectId: string) => {
    const current = formData.subjectIds || []
    const newSubjects = current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId]
    setFormData({ ...formData, subjectIds: newSubjects })
  }

  const toggleGradeLevel = (level: GradeLevel) => {
    const current = formData.gradeLevels || []
    const newLevels = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level]
    setFormData({ ...formData, gradeLevels: newLevels })
  }

  const selectSuggestion = (suggestion: { name: string; publisher: string }) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      publisher: suggestion.publisher,
    })
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading curriculum packages...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Curriculum Packages
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track the commercial curriculum products your family uses
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            + Add Package
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {editingId ? 'Edit Package' : 'Add New Package'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>

            {/* Quick suggestions */}
            {!editingId && (
              <div className="mb-4">
                <label className="label">Quick Add (Popular Curricula)</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_PACKAGES.slice(0, 6).map((pkg) => (
                    <button
                      key={pkg.name}
                      type="button"
                      onClick={() => selectSuggestion(pkg)}
                      className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-fuchsia-50 hover:border-fuchsia-300 dark:hover:bg-fuchsia-900/20 transition-colors"
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Package Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Saxon Math 5/4"
                  required
                />
              </div>
              <div>
                <label className="label">Publisher</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="input"
                  placeholder="e.g., Saxon Publishers"
                />
              </div>
            </div>

            <div>
              <label className="label">Website URL</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="label">Subjects</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      formData.subjectIds?.includes(subject.id)
                        ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:border-fuchsia-700 dark:text-fuchsia-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Grade Levels</label>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => toggleGradeLevel(level.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      formData.gradeLevels?.includes(level.value)
                        ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:border-fuchsia-700 dark:text-fuchsia-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={2}
                placeholder="Any notes about this curriculum..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Currently using this curriculum
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Add Package'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Package List */}
      {packages.length === 0 && !showAddForm ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Curriculum Packages Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Track the curriculum products your family uses for homeschooling.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Add Your First Package
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => {
            const pkgSubjects = subjects.filter((s) => pkg.subjectIds.includes(s.id))
            return (
              <div
                key={pkg.id}
                className={`card hover:shadow-md transition-shadow ${
                  !pkg.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      {!pkg.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {pkg.publisher && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {pkg.publisher}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pkgSubjects.map((subject) => (
                        <span
                          key={subject.id}
                          className="px-2 py-0.5 text-xs bg-fuchsia-50 text-fuchsia-700 rounded dark:bg-fuchsia-900/30 dark:text-fuchsia-300"
                        >
                          {subject.name}
                        </span>
                      ))}
                      {pkg.gradeLevels.map((level) => (
                        <span
                          key={level}
                          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {GRADE_LEVELS.find((g) => g.value === level)?.label || level}
                        </span>
                      ))}
                    </div>

                    {pkg.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {pkg.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {pkg.websiteUrl && (
                      <a
                        href={pkg.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400"
                      >
                        Visit Site
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
