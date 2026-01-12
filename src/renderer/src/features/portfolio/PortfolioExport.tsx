import { useState, useEffect } from 'react'
import { PortfolioNarrative } from '../aiInsights'
import type { PortfolioConfig, PortfolioSection, Student } from '../../../../shared/types'

interface Props {
  students: Student[]
}

const DEFAULT_SECTIONS: PortfolioSection[] = [
  { id: 'cover', name: 'Cover Page', enabled: true },
  { id: 'student-info', name: 'Student Information', enabled: true },
  { id: 'narrative', name: 'AI Narrative Summary', enabled: false },
  { id: 'attendance', name: 'Attendance Record', enabled: true },
  { id: 'activities', name: 'Learning Activities', enabled: true },
  { id: 'subjects', name: 'Subject Summaries', enabled: true },
  { id: 'reading', name: 'Reading Log', enabled: true },
  { id: 'milestones', name: 'Milestones', enabled: true },
  { id: 'photos', name: 'Photo Gallery', enabled: false }
]

export function PortfolioExport({ students }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [schoolYear, setSchoolYear] = useState<string>('')
  const [title, setTitle] = useState('Homeschool Portfolio')
  const [subtitle, setSubtitle] = useState('')
  const [sections, setSections] = useState<PortfolioSection[]>(DEFAULT_SECTIONS)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successPath, setSuccessPath] = useState<string | null>(null)
  const [aiNarrative, setAiNarrative] = useState<string | null>(null)

  // Load current school year on mount
  useEffect(() => {
    window.api.getCurrentSchoolYear().then(setSchoolYear)
  }, [])

  // Auto-select first student
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId])

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  // Calculate date range from school year
  const getDateRange = () => {
    const [startYear] = schoolYear.split('/')
    return {
      startDate: `${startYear}-08-01`,
      endDate: `${parseInt(startYear) + 1}-07-31`
    }
  }

  const handleSectionToggle = (sectionId: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    )

    // Enable photos if photo section is enabled
    if (sectionId === 'photos') {
      const photoSection = sections.find(s => s.id === 'photos')
      if (photoSection && !photoSection.enabled) {
        setIncludePhotos(true)
      } else {
        setIncludePhotos(false)
      }
    }
  }

  const handleGenerate = async () => {
    if (!selectedStudentId || !schoolYear) {
      setError('Please select a student and school year')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccessPath(null)

    try {
      const config: PortfolioConfig = {
        title,
        subtitle: subtitle || undefined,
        schoolYear,
        studentId: selectedStudentId,
        dateRange: getDateRange(),
        sections,
        includePhotos,
        includeSummaryStats: true
      }

      const result = await window.api.generatePortfolioPDF(config)

      if (result.success && result.filePath) {
        setSuccessPath(result.filePath)
      } else {
        setError(result.error || 'Failed to generate PDF')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenFile = async () => {
    if (successPath) {
      await window.api.openPortfolioFile(successPath)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Generate Portfolio PDF
      </h2>

      <div className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a student...</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* School Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            School Year
          </label>
          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select school year...</option>
            {/* Generate last 3 school years as options */}
            {[0, 1, 2].map(offset => {
              const year = new Date().getFullYear() - offset
              const month = new Date().getMonth()
              const startYear = month < 7 ? year - 1 - offset : year - offset
              const yearStr = `${startYear}/${startYear + 1}`
              return (
                <option key={yearStr} value={yearStr}>
                  {yearStr}
                </option>
              )
            })}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Portfolio Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Homeschool Portfolio"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subtitle (optional)
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g., A Year of Discovery"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Include Sections
          </label>
          <div className="grid grid-cols-2 gap-3">
            {sections.map(section => (
              <label
                key={section.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                  hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => handleSectionToggle(section.id)}
                  className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded
                    focus:ring-fuchsia-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {section.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Narrative Generator - show when narrative section is enabled */}
        {sections.find(s => s.id === 'narrative')?.enabled && selectedStudent && schoolYear && (
          <div className="border border-fuchsia-200 rounded-lg p-4 bg-fuchsia-50/50">
            <PortfolioNarrative
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              gradeLevel={selectedStudent.gradeLevel}
              schoolYear={schoolYear}
              dateRange={getDateRange()}
              onNarrativeGenerated={setAiNarrative}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successPath && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Portfolio generated successfully!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mb-3 font-mono break-all">
              {successPath}
            </p>
            <button
              onClick={handleOpenFile}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Open PDF
            </button>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedStudentId || !schoolYear}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            isGenerating || !selectedStudentId || !schoolYear
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-fuchsia-500 hover:bg-fuchsia-600'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating PDF...
            </span>
          ) : (
            'Generate Portfolio PDF'
          )}
        </button>

        {/* Info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            The portfolio will be saved to your Documents folder in "Homeschool Portfolios".
            {selectedStudent && schoolYear && (
              <span className="block mt-1">
                Date range: August 1, {schoolYear.split('/')[0]} - July 31, {schoolYear.split('/')[1]}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
