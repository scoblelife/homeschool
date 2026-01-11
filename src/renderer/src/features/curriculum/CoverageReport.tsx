import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { useCurriculumStore } from './curriculumStore'
import type { GradeLevel } from '../../../../shared/types'

interface Props {
  studentId?: string
  gradeLevel?: GradeLevel
}

export function CoverageReport({ studentId, gradeLevel }: Props) {
  const { students, getSelectedStudent } = useStore()
  const { report, isLoading, loadReport } = useCurriculumStore()
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '')

  const selectedStudent = students.find(s => s.id === selectedStudentId) || getSelectedStudent()
  const effectiveGradeLevel = gradeLevel || selectedStudent?.gradeLevel

  useEffect(() => {
    if (selectedStudentId && effectiveGradeLevel) {
      loadReport(selectedStudentId, effectiveGradeLevel)
    }
  }, [selectedStudentId, effectiveGradeLevel, loadReport])

  // Auto-select first student
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId])

  if (!selectedStudentId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Select a student to view curriculum coverage.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading coverage report...
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center text-gray-500 py-8">
        No coverage data available.
      </div>
    )
  }

  // Calculate color based on coverage percentage
  const getCoverageColor = (percent: number) => {
    if (percent >= 75) return 'bg-green-500'
    if (percent >= 50) return 'bg-yellow-500'
    if (percent >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getCoverageTextColor = (percent: number) => {
    if (percent >= 75) return 'text-green-700 dark:text-green-400'
    if (percent >= 50) return 'text-yellow-700 dark:text-yellow-400'
    if (percent >= 25) return 'text-orange-700 dark:text-orange-400'
    return 'text-red-700 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Student Selector (if not passed as prop) */}
      {!studentId && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Student:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.gradeLevel})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overall Coverage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Coverage
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {report.coveredStandards} of {report.totalStandards} standards covered
              </span>
              <span className={`text-sm font-semibold ${getCoverageTextColor(report.coveragePercent)}`}>
                {report.coveragePercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${getCoverageColor(report.coveragePercent)}`}
                style={{ width: `${report.coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coverage by Subject */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Coverage by Subject
        </h3>
        <div className="space-y-4">
          {report.bySubject.map(subject => (
            <div key={subject.subjectId}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {subject.subjectName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {subject.covered}/{subject.total} ({subject.coveragePercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getCoverageColor(subject.coveragePercent)}`}
                  style={{ width: `${subject.coveragePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage by Domain */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Coverage by Domain
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.byDomain.map(domain => (
            <div
              key={domain.domain}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-2">
                  {domain.domain}
                </span>
                <span className={`text-sm font-semibold ${getCoverageTextColor(domain.coveragePercent)}`}>
                  {domain.coveragePercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all ${getCoverageColor(domain.coveragePercent)}`}
                  style={{ width: `${domain.coveragePercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {domain.covered} of {domain.total} standards
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Uncovered Standards */}
      {report.uncoveredStandards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Uncovered Standards ({report.uncoveredStandards.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.uncoveredStandards.map(standard => (
              <div
                key={standard.id}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 text-xs font-mono bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded">
                    {standard.code}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {standard.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {standard.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {standard.domain}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
