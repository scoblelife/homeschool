import { useState } from 'react'
import { HourReport, PrintableHourReport } from '../features/hourTracking'
import { useStore } from '../stores/useStore'

export default function HourTracking() {
  const { students, selectedStudentId } = useStore()
  const [showPrintable, setShowPrintable] = useState(false)
  const [printStudentId, setPrintStudentId] = useState('')
  const [printSchoolYear, setPrintSchoolYear] = useState('')
  const [printState, setPrintState] = useState('NV')

  const handleGenerateReport = (studentId: string, schoolYear: string, state: string) => {
    setPrintStudentId(studentId)
    setPrintSchoolYear(schoolYear)
    setPrintState(state)
    setShowPrintable(true)
  }

  return (
    <div className="p-6">
      {!showPrintable ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hour Tracking
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track instructional hours and generate official reports
              </p>
            </div>
          </div>

          <HourReport studentId={selectedStudentId || undefined} />

          {/* Generate Official Report Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Official Hour Report
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a printable official report for compliance documentation.
            </p>
            <GenerateReportForm
              students={students}
              onGenerate={handleGenerateReport}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 print:hidden">
            <button
              onClick={() => setShowPrintable(false)}
              className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-2"
            >
              <BackIcon />
              Back to Hour Tracking
            </button>
          </div>
          <PrintableHourReport
            studentId={printStudentId}
            schoolYear={printSchoolYear}
            selectedState={printState}
          />
        </>
      )}
    </div>
  )
}

interface GenerateReportFormProps {
  students: Array<{ id: string; name: string; gradeLevel: string }>
  onGenerate: (studentId: string, schoolYear: string, state: string) => void
}

function GenerateReportForm({ students, onGenerate }: GenerateReportFormProps) {
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [schoolYear, setSchoolYear] = useState('')
  const [state, setState] = useState('NV')

  // Get school year options
  const yearOptions = (() => {
    const years: string[] = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const month = now.getMonth()

    for (let i = 0; i < 3; i++) {
      const startYear = month < 7 ? currentYear - 1 - i : currentYear - i
      years.push(`${startYear}/${startYear + 1}`)
    }

    return years
  })()

  // Set default school year on mount
  useState(() => {
    if (!schoolYear && yearOptions.length > 0) {
      setSchoolYear(yearOptions[0])
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (studentId && schoolYear) {
      onGenerate(studentId, schoolYear, state)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Student
        </label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          School Year
        </label>
        <select
          value={schoolYear}
          onChange={(e) => setSchoolYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {yearOptions.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          State
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="NV">Nevada</option>
          <option value="CA">California</option>
          <option value="TX">Texas</option>
          <option value="FL">Florida</option>
          <option value="PA">Pennsylvania</option>
        </select>
      </div>

      <button
        type="submit"
        className="btn btn-primary flex items-center gap-2"
      >
        <DocumentIcon />
        Generate Official Report
      </button>
    </form>
  )
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
